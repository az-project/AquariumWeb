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
  selectedAquariumBackground,
  tankAquariumType,
  type FishRouteState,
  type FishWaypoint
} from "@/lib/domain/derive";
import type { LivestockMotionPair } from "@/lib/domain/constants";
import type { Livestock, Tank } from "@/lib/domain/types";
import { needsStaticAlphaVideoFallback } from "@/lib/media/capabilities";
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
  basePos: (typeof MOTION_FISH_POSITIONS)[number];
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

function MotionFish({ asset, basePos, fishOrder, index, item, motion, selected, onSelect }: MotionFishProps) {
  const initialRoute: FishWaypoint = {
    x: clamp(percentNumber(item.tankPosition?.x, basePos.x), 18, 82),
    y: clamp(percentNumber(item.tankPosition?.y, basePos.y), 18, 80),
    direction: fishOrder % 2 === 0 ? "right" : "left",
    segmentsRemaining: 2 + (fishOrder % 2),
    durationMs: 0
  };
  const [route, setRoute] = useState(initialRoute);
  // SSR와 첫 페인트는 안전한 PNG를 사용한다. 지원 브라우저만 영상으로 전환한다.
  const [useStaticAlphaFallback, setUseStaticAlphaFallback] = useState(true);
  const routeRef = useRef<FishRouteState>(initialRoute);

  useEffect(() => {
    setUseStaticAlphaFallback(
      needsStaticAlphaVideoFallback({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints
      })
    );
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const moveToNextWaypoint = () => {
      if (disposed) return;
      const next = nextFishWaypoint(routeRef.current);
      routeRef.current = next;
      setRoute(next);
      timer = setTimeout(moveToNextWaypoint, next.durationMs);
    };

    timer = setTimeout(moveToNextWaypoint, 120 + fishOrder * 160);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [fishOrder]);

  const style = {
    left: `${route.x}%`,
    top: `${route.y}%`,
    "--scale": basePos.scale,
    "--travel-duration": `${route.durationMs}ms`
  } as CSSProperties;

  return (
    <button
      className={`motion-fish direction-${route.direction} ${useStaticAlphaFallback ? "static-alpha-fallback" : ""} ${selected ? "selected" : ""}`}
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
        {!useStaticAlphaFallback ? (
          <video className="motion-fish-video" src={motion.right} poster={asset} autoPlay loop muted playsInline preload="metadata" />
        ) : null}
      </span>
      <span className="motion-fish-facing motion-fish-facing-left" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="motion-fish-fallback" src={asset} alt="" />
        {!useStaticAlphaFallback ? (
          <video className="motion-fish-video" src={motion.left} poster={asset} autoPlay loop muted playsInline preload="metadata" />
        ) : null}
      </span>
    </button>
  );
}

function MotionFishLayer({ tank, selectedIndex, onSelect }: MotionFishLayerProps) {
  const type = tankAquariumType(tank);
  const fish = tank.livestock.flatMap((item, index) => {
    if (inhabitantKind(item.type) !== "fish") return [];
    const motion = livestockMotion(item.name);
    if (!motion) return [];
    return [{ item, index, motion }];
  });

  if (!fish.length) return null;

  return (
    <div className="motion-fish-layer" aria-label="영상으로 유영 중인 물고기">
      {fish.map(({ item, index, motion }, fishOrder) => {
        const basePos = MOTION_FISH_POSITIONS[fishOrder % MOTION_FISH_POSITIONS.length];
        const asset = livestockImage(item, index, type);
        return (
          <MotionFish
            key={`${tank.id}-${item.name}-${index}`}
            asset={asset}
            basePos={basePos}
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
          const basePos = REEF_POSITIONS[index % REEF_POSITIONS.length];
          const pos = item.tankPosition ? { ...basePos, ...item.tankPosition } : basePos;
          const palette = PALETTES[index % PALETTES.length];
          const asset = livestockImage(item, index, type);
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
              {asset ? (
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
