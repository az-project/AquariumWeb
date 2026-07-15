"use client";

// app.js:625-735(시각화), 1332-1420(드래그·커서) 이식.
// 드래그 중에는 리렌더 없이 DOM style을 직접 조작하고, 드래그 종료 시에만
// store에 tankPosition을 커밋한다 (바닐라와 동일한 명령형 패턴).
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  clamp,
  inhabitantKind,
  livestockImage,
  livestockMotion,
  nextFishWaypoint,
  nextInvertebrateWaypoint,
  selectedAquariumBackground,
  tankAquariumType,
  type FishMotionProfile,
  type FishRouteState,
  type FishWaypoint
} from "@/lib/domain/derive";
import type { LivestockMotionPair } from "@/lib/domain/constants";
import type { Livestock, Tank } from "@/lib/domain/types";
import { preferredAlphaVideoFormat, type AlphaVideoFormat } from "@/lib/media/capabilities";
import { useAppStore } from "@/lib/state/store";
import { PixiFishLayer } from "./PixiFishLayer";

const REEF_POSITIONS = [
  { x: "30%", y: "72%", scale: ".84" },
  { x: "66%", y: "71%", scale: ".78" },
  { x: "20%", y: "77%", scale: ".66" },
  { x: "76%", y: "76%", scale: ".68" },
  { x: "48%", y: "75%", scale: ".6" },
  { x: "86%", y: "70%", scale: ".58" }
];
const MOTION_FISH_POSITIONS = [
  { x: "62%", y: "42%", scale: ".96" },
  { x: "73%", y: "55%", scale: ".82" },
  { x: "52%", y: "31%", scale: ".72" },
  { x: "39%", y: "46%", scale: ".88" },
  { x: "83%", y: "36%", scale: ".66" },
  { x: "47%", y: "52%", scale: ".78" },
  { x: "68%", y: "25%", scale: ".62" },
  { x: "58%", y: "38%", scale: ".7" }
];
const MOTION_INVERTEBRATE_POSITIONS = [
  { x: "58%", y: "74%", scale: ".66" },
  { x: "42%", y: "78%", scale: ".6" },
  { x: "70%", y: "71%", scale: ".58" },
  { x: "30%", y: "76%", scale: ".62" }
];
const PALETTES: [string, string][] = [
  ["#ffcf68", "#ff7f73"],
  ["#6ee7ff", "#159fb7"],
  ["#ffe66f", "#f0bd4f"],
  ["#b9a8ff", "#5fc6ff"],
  ["#7ff0d4", "#20bfa0"]
];

interface MotionFishLayerProps {
  tank: Tank;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

interface MotionFishProps {
  asset: string;
  aquariumType: string;
  basePos: (typeof MOTION_FISH_POSITIONS)[number] | (typeof MOTION_INVERTEBRATE_POSITIONS)[number];
  fishOrder: number;
  index: number;
  item: Livestock;
  motion: LivestockMotionPair;
  selected: boolean;
  onSelect: (index: number) => void;
}

function percentNumber(value: string | undefined, fallback: string): number {
  const parsed = Number.parseFloat(value || "");
  return Number.isFinite(parsed) ? parsed : Number.parseFloat(fallback);
}

function isMp4(src: string): boolean {
  return src.toLowerCase().endsWith(".mp4");
}

function isEdgeWhiteBackground(data: Uint8ClampedArray, pixelIndex: number): boolean {
  const offset = pixelIndex * 4;
  const red = data[offset] || 0;
  const green = data[offset + 1] || 0;
  const blue = data[offset + 2] || 0;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const isChromaGreen = green > 45 && green > red * 1.25 && green > blue * 1.15 && green - red > 18;

  return isChromaGreen || (min > 210 && (max - min < 54 || min > 238));
}

function removeEdgeWhiteBackground(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const total = width * height;
  const visited = new Uint8Array(total);
  const stack = new Int32Array(total);
  let stackSize = 0;

  const push = (index: number) => {
    if (index < 0 || index >= total || visited[index] || !isEdgeWhiteBackground(data, index)) return;
    visited[index] = 1;
    stack[stackSize] = index;
    stackSize += 1;
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (stackSize > 0) {
    stackSize -= 1;
    const index = stack[stackSize] || 0;
    data[index * 4 + 3] = 0;
    const x = index % width;

    if (x > 0) push(index - 1);
    if (x < width - 1) push(index + 1);
    if (index >= width) push(index - width);
    if (index < total - width) push(index + width);
  }

  return imageData;
}

function ChromaKeyVideo({ className, playbackRate = 1, poster, src }: { className: string; playbackRate?: number; poster: string; src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !context) return;

    const frameVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };
    const maxCanvasSize = 260;
    let frameId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const render = () => {
      if (disposed) return;
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const scale = Math.min(1, maxCanvasSize / Math.max(video.videoWidth, video.videoHeight));
        const width = Math.max(1, Math.round(video.videoWidth * scale));
        const height = Math.max(1, Math.round(video.videoHeight * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        context.putImageData(removeEdgeWhiteBackground(imageData), 0, 0);
      }
      scheduleFrame();
    };

    const scheduleFrame = () => {
      if (disposed) return;
      if (frameVideo.requestVideoFrameCallback) {
        frameId = frameVideo.requestVideoFrameCallback(render);
      } else {
        timeoutId = setTimeout(render, 40);
      }
    };

    const start = () => {
      video.playbackRate = playbackRate;
      void video.play().catch(() => undefined);
      if (!frameId && !timeoutId) scheduleFrame();
    };

    video.addEventListener("loadeddata", start);
    video.addEventListener("play", start);
    start();

    return () => {
      disposed = true;
      if (frameId && frameVideo.cancelVideoFrameCallback) frameVideo.cancelVideoFrameCallback(frameId);
      if (timeoutId) clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", start);
      video.removeEventListener("play", start);
    };
  }, [playbackRate, src]);

  return (
    <>
      <video ref={videoRef} className="chroma-source-video" src={src} poster={poster} autoPlay loop muted playsInline preload="auto" />
      <canvas ref={canvasRef} className={className} aria-hidden="true" />
    </>
  );
}

function MotionVideo({ className, playbackRate = 1, poster, src }: { className: string; playbackRate?: number; poster: string; src: string }) {
  if (isMp4(src)) return <ChromaKeyVideo className={className} playbackRate={playbackRate} poster={poster} src={src} />;
  return <video className={className} src={src} poster={poster} autoPlay loop muted playsInline preload="metadata" />;
}

function sharedMotionFacing(motion: LivestockMotionPair): "left" | "right" {
  const source = motion.right.webm || motion.right.hevc || motion.left.webm || motion.left.hevc;
  return /-left\.(mp4|webm|mov)$/i.test(source) ? "left" : "right";
}

function speciesMotionProfile(name: string, aquariumType: string): FishMotionProfile {
  if (/\uBE14\uB799|\uBAB0\uB9AC|black|molly/i.test(name)) return "steady";
  if (/\uC81C\uBE0C\uB77C|\uB2E4\uB2C8\uC624|zebra|danio/i.test(name)) return "active";
  return aquariumType === "freshwater" ? "gentle" : "default";
}

function speciesVideoRate(name: string): number {
  if (/\uBE14\uB799|\uBAB0\uB9AC|black|molly/i.test(name)) return 0.82;
  if (/\uC81C\uBE0C\uB77C|\uB2E4\uB2C8\uC624|zebra|danio/i.test(name)) return 0.9;
  return 1;
}

// SSR와 첫 페인트는 안전한 PNG를 사용한다. 마운트 후 브라우저 계열에 맞는
// 알파 코덱(WebKit=HEVC, 그 외=WebM)의 영상으로 전환한다.
function useAlphaVideoFormat(): AlphaVideoFormat | null {
  const [videoFormat, setVideoFormat] = useState<AlphaVideoFormat | null>(null);

  useEffect(() => {
    setVideoFormat(
      preferredAlphaVideoFormat({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints
      })
    );
  }, []);

  return videoFormat;
}

function MotionFish({ asset, aquariumType, basePos, fishOrder, index, item, motion, selected, onSelect }: MotionFishProps) {
  const kind = inhabitantKind(item.type);
  const initialRoute: FishWaypoint = {
    x: clamp(percentNumber(item.tankPosition?.x, basePos.x), 18, 82),
    y: kind === "invert"
      ? clamp(percentNumber(item.tankPosition?.y, basePos.y), 65, 82)
      : clamp(percentNumber(item.tankPosition?.y, basePos.y), 18, 80),
    direction: fishOrder % 2 === 0 ? "right" : "left",
    segmentsRemaining: 2 + (fishOrder % 2),
    durationMs: 0
  };
  const [route, setRoute] = useState(initialRoute);
  const videoFormat = useAlphaVideoFormat();
  const routeRef = useRef<FishRouteState>(initialRoute);
  const usesSharedMotion =
    motion.left.webm === motion.right.webm &&
    motion.left.hevc === motion.right.hevc;
  const sourceFacing = usesSharedMotion ? sharedMotionFacing(motion) : "right";
  const motionProfile = speciesMotionProfile(item.name, aquariumType);
  const videoRate = speciesVideoRate(item.name);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const moveToNextWaypoint = () => {
      if (disposed) return;
      const next = kind === "invert"
        ? nextInvertebrateWaypoint(routeRef.current)
        : nextFishWaypoint(routeRef.current, Math.random, motionProfile);
      routeRef.current = next;
      setRoute(next);
      timer = setTimeout(moveToNextWaypoint, next.durationMs);
    };

    timer = setTimeout(moveToNextWaypoint, 120 + fishOrder * 160);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [aquariumType, fishOrder, kind, motionProfile]);

  const style = {
    left: `${route.x}%`,
    top: `${route.y}%`,
    "--scale": basePos.scale,
    "--travel-duration": `${route.durationMs}ms`
  } as CSSProperties;
  const rightMotionSrc = videoFormat !== null ? motion.right[videoFormat] : "";
  const leftMotionSrc = videoFormat !== null ? motion.left[videoFormat] : "";

  return (
    <button
      className={`motion-fish direction-${route.direction} ${usesSharedMotion ? `shared-motion shared-source-${sourceFacing}` : ""} ${videoFormat === null ? "static-alpha-fallback" : ""} ${selected ? "selected" : ""}`}
      data-livestock-index={index}
      data-fish-direction={route.direction}
      data-route-segments={route.segmentsRemaining}
      type="button"
      title={item.name}
      aria-label={item.name}
      style={style}
      onClick={() => onSelect(index)}
    >
      <span className="motion-fish-facing motion-fish-facing-right" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="motion-fish-fallback" src={asset} alt="" />
        {videoFormat !== null ? (
          <MotionVideo className="motion-fish-video" playbackRate={videoRate} src={rightMotionSrc} poster={asset} />
        ) : null}
      </span>
      <span className="motion-fish-facing motion-fish-facing-left" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="motion-fish-fallback" src={asset} alt="" />
        {videoFormat !== null ? (
          <MotionVideo className="motion-fish-video" playbackRate={videoRate} src={leftMotionSrc} poster={asset} />
        ) : null}
      </span>
    </button>
  );
}

function MotionFishLayer({ tank, selectedIndex, onSelect }: MotionFishLayerProps) {
  const type = tankAquariumType(tank);
  const fish = tank.livestock.flatMap((item, index) => {
    if (inhabitantKind(item.type) === "coral") return [];
    const motion = livestockMotion(item.name);
    if (!motion) return [];
    return [{ item, index, motion }];
  });

  if (!fish.length) return null;

  return (
    <div className="motion-fish-layer" aria-label="영상으로 유영 중인 물고기">
      {fish.map(({ item, index, motion }, fishOrder) => {
        const kind = inhabitantKind(item.type);
        const basePositions = kind === "invert" ? MOTION_INVERTEBRATE_POSITIONS : MOTION_FISH_POSITIONS;
        const basePos = basePositions[fishOrder % basePositions.length];
        const asset = livestockImage(item, index, type);
        return (
          <MotionFish
            key={`${tank.id}-${item.name}-${index}`}
            asset={asset}
            basePos={basePos}
            aquariumType={type}
            fishOrder={fishOrder}
            index={index}
            item={item}
            motion={motion}
            selected={selectedIndex === index}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

interface AquariumVisualProps {
  tank: Tank;
  onOpenTankSettings: () => void;
}

export function AquariumVisual({ tank, onOpenTankSettings }: AquariumVisualProps) {
  const selectedLivestockIndex = useAppStore(state => state.selectedLivestockIndex);
  const selectLivestock = useAppStore(state => state.selectLivestock);

  const stageRef = useRef<HTMLDivElement>(null);
  const suppressClickUntilRef = useRef(0);
  const videoFormat = useAlphaVideoFormat();

  const type = tankAquariumType(tank);
  const background = selectedAquariumBackground(tank);

  // app.js:1359-1410 — pointer 드래그 (레이어 위임)
  // app.js:1332-1357 — 마우스 idle 커서
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const clearIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = null;
    };
    const showCursorThenIdle = (event: PointerEvent | MouseEvent) => {
      if ("pointerType" in event && event.pointerType && event.pointerType !== "mouse") return;
      stage.classList.remove("cursor-idle");
      clearIdleTimer();
      idleTimer = setTimeout(() => stage.classList.add("cursor-idle"), 450);
    };
    const resetCursor = () => {
      clearIdleTimer();
      stage.classList.remove("cursor-idle");
    };
    stage.addEventListener("pointerenter", showCursorThenIdle);
    stage.addEventListener("pointermove", showCursorThenIdle);
    stage.addEventListener("pointerleave", resetCursor);
    return () => {
      clearIdleTimer();
      stage.removeEventListener("pointerenter", showCursorThenIdle);
      stage.removeEventListener("pointermove", showCursorThenIdle);
      stage.removeEventListener("pointerleave", resetCursor);
    };
  }, []);

  function handleInhabitantClick(index: number) {
    suppressClickUntilRef.current = Date.now() + 250;
    selectLivestock(index);
  }

  function handleStageClick(event: MouseEvent<HTMLDivElement>) {
    if (Date.now() < suppressClickUntilRef.current) return;
    if ((event.target as HTMLElement).closest("[data-livestock-index]")) return;
    onOpenTankSettings();
  }

  return (
    <div
      className="aquarium-stage"
      aria-label="어항 배경 변경"
      ref={stageRef}
      onClick={handleStageClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img id="aquariumBackgroundImage" src={background.src} alt={`${background.label} 어항 배경`} />
      <PixiFishLayer tank={tank} selectedIndex={selectedLivestockIndex} onSelect={handleInhabitantClick} />
      <MotionFishLayer tank={tank} selectedIndex={selectedLivestockIndex} onSelect={handleInhabitantClick} />
      <div className="tank-inhabitants" id="tankInhabitants" aria-label="투입된 산호와 무척추생물 표시">
        {tank.livestock.map((item, index) => {
          const kind = inhabitantKind(item.type);
          if (kind === "fish") return null;
          const motion = livestockMotion(item.name);
          if (motion && kind !== "coral") return null;
          const basePos = REEF_POSITIONS[index % REEF_POSITIONS.length];
          const pos = item.tankPosition ? { ...basePos, ...item.tankPosition } : basePos;
          const palette = PALETTES[index % PALETTES.length];
          const asset = livestockImage(item, index, type);
          // Safari는 VP9 WebM 알파를 합성하지 못하므로 물고기와 동일하게 브라우저별 코덱을 선택한다.
          const motionSrc = motion && videoFormat !== null ? motion.right[videoFormat] : "";
          const style = {
            "--x": pos.x,
            "--y": pos.y,
            "--scale": pos.scale,
            "--delay": `${(index % 5) * -0.7}s`,
            "--bob": `${4 + (index % 3) * 1.5}px`,
            "--fish-a": palette[0],
            "--fish-b": palette[1]
          } as CSSProperties;
          return (
            <button
              key={`${item.name}-${index}`}
              className={`inhabitant ${kind} ${asset ? "has-image" : ""} ${selectedLivestockIndex === index ? "selected" : ""}`}
              data-livestock-index={index}
              type="button"
              title={item.name}
              style={style}
              onClick={() => handleInhabitantClick(index)}
            >
              {motionSrc ? (
                <MotionVideo className="inhabitant-image" src={motionSrc} poster={asset} />
              ) : asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="inhabitant-image" src={asset} alt={item.name} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
