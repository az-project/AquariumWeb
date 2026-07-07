"use client";

// app.js:625-735(시각화), 1332-1420(드래그·커서) 이식.
// 드래그 중에는 리렌더 없이 DOM style을 직접 조작하고, 드래그 종료 시에만
// store에 tankPosition을 커밋한다 (바닐라와 동일한 명령형 패턴).
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { clamp, fishVariant, inhabitantKind, livestockImage, selectedAquariumBackground, tankAquariumType } from "@/lib/domain/derive";
import type { Tank, TankPosition } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";

const FISH_POSITIONS = [
  { x: "62%", y: "42%", scale: ".96" },
  { x: "73%", y: "55%", scale: ".82" },
  { x: "52%", y: "31%", scale: ".72" },
  { x: "39%", y: "46%", scale: ".88" },
  { x: "83%", y: "36%", scale: ".66" },
  { x: "47%", y: "52%", scale: ".78" },
  { x: "68%", y: "25%", scale: ".62" },
  { x: "58%", y: "38%", scale: ".7" }
];
const REEF_POSITIONS = [
  { x: "30%", y: "72%", scale: ".84" },
  { x: "66%", y: "71%", scale: ".78" },
  { x: "20%", y: "77%", scale: ".66" },
  { x: "76%", y: "76%", scale: ".68" },
  { x: "48%", y: "75%", scale: ".6" },
  { x: "86%", y: "70%", scale: ".58" }
];
const PALETTES: [string, string][] = [
  ["#ffcf68", "#ff7f73"],
  ["#6ee7ff", "#159fb7"],
  ["#ffe66f", "#f0bd4f"],
  ["#b9a8ff", "#5fc6ff"],
  ["#7ff0d4", "#20bfa0"]
];

function FishArt({ variant }: { variant: string }) {
  return (
    <span className="fish-art">
      <span className="fish-shadow" />
      <span className="fish-tail" />
      <span className="fish-body" />
      <span className="fish-fin" />
      <span className="fish-shine" />
      <span className="fish-eye" />
      <span className="fish-mouth" />
      {variant === "clown" && (
        <>
          <span className="fish-stripe one" />
          <span className="fish-stripe two" />
        </>
      )}
    </span>
  );
}

interface DragState {
  button: HTMLElement;
  index: number;
  rect: DOMRect;
  startX: number;
  startY: number;
  moved: boolean;
}

function pointerTankPosition(event: PointerEvent, rect: DOMRect): TankPosition {
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 7, 93);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88);
  return { x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` };
}

interface AquariumVisualProps {
  tank: Tank;
  onOpenTankSettings: () => void;
}

export function AquariumVisual({ tank, onOpenTankSettings }: AquariumVisualProps) {
  const selectedLivestockIndex = useAppStore(state => state.selectedLivestockIndex);
  const selectLivestock = useAppStore(state => state.selectLivestock);
  const setLivestockPosition = useAppStore(state => state.setLivestockPosition);

  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickUntilRef = useRef(0);

  const type = tankAquariumType(tank);
  const background = selectedAquariumBackground(tank);

  // app.js:1359-1410 — pointer 드래그 (레이어 위임)
  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return;

    function onPointerDown(event: PointerEvent) {
      const button = (event.target as HTMLElement).closest<HTMLElement>("[data-livestock-index]");
      if (!button || event.button !== 0 || !stage) return;
      dragStateRef.current = {
        button,
        index: Number(button.dataset.livestockIndex),
        rect: stage.getBoundingClientRect(),
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("dragging");
    }

    function onPointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(dx, dy) < 4) return;
      dragState.moved = true;
      const pos = pointerTankPosition(event, dragState.rect);
      dragState.button.style.setProperty("--x", pos.x);
      dragState.button.style.setProperty("--y", pos.y);
      event.preventDefault();
    }

    function finishDrag(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      const { button, index, moved, rect } = dragState;
      button.releasePointerCapture?.(event.pointerId);
      button.classList.remove("dragging");
      if (moved) {
        const pos = pointerTankPosition(event, rect);
        button.style.setProperty("--x", pos.x);
        button.style.setProperty("--y", pos.y);
        suppressClickUntilRef.current = Date.now() + 350;
        setLivestockPosition(index, pos);
      }
      dragStateRef.current = null;
    }

    layer.addEventListener("pointerdown", onPointerDown);
    layer.addEventListener("pointermove", onPointerMove);
    layer.addEventListener("pointerup", finishDrag);
    layer.addEventListener("pointercancel", finishDrag);
    return () => {
      layer.removeEventListener("pointerdown", onPointerDown);
      layer.removeEventListener("pointermove", onPointerMove);
      layer.removeEventListener("pointerup", finishDrag);
      layer.removeEventListener("pointercancel", finishDrag);
    };
  }, [setLivestockPosition]);

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
    if (Date.now() < suppressClickUntilRef.current) return;
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
      <div className="tank-inhabitants" id="tankInhabitants" aria-label="투입된 생물 표시" ref={layerRef}>
        {tank.livestock.map((item, index) => {
          const kind = inhabitantKind(item.type);
          const posPool = kind === "fish" ? FISH_POSITIONS : REEF_POSITIONS;
          const basePos = posPool[index % posPool.length];
          const pos = item.tankPosition ? { ...basePos, ...item.tankPosition } : basePos;
          const palette = PALETTES[index % PALETTES.length];
          const variant = fishVariant(item.name, index);
          const asset = livestockImage(item, index, type);
          const swimClass = kind === "fish" ? `swim-${index % 3} ${index % 2 === 1 ? "reverse" : ""}` : "";
          const style = {
            "--x": pos.x,
            "--y": pos.y,
            "--scale": pos.scale,
            "--delay": `${(index % 5) * -0.7}s`,
            "--swim": `${12 + (index % 4) * 3}s`,
            "--path": `${38 + (index % 3) * 7}px`,
            "--arc": `${index % 3 === 0 ? -18 : index % 3 === 1 ? 14 : -10}px`,
            "--bob": `${7 + (index % 3) * 2}px`,
            "--fish-a": palette[0],
            "--fish-b": palette[1]
          } as CSSProperties;
          return (
            <button
              key={`${item.name}-${index}`}
              className={`inhabitant ${kind} ${variant} ${swimClass} ${asset ? "has-image" : ""} ${selectedLivestockIndex === index ? "selected" : ""}`}
              data-livestock-index={index}
              type="button"
              title={item.name}
              style={style}
              onClick={() => handleInhabitantClick(index)}
            >
              {asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="inhabitant-image" src={asset} alt={item.name} />
              ) : kind === "fish" ? (
                <FishArt variant={variant} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
