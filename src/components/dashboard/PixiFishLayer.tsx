"use client";

import { useEffect, useRef } from "react";
import { inhabitantKind, livestockImage, livestockMotion, tankAquariumType } from "@/lib/domain/derive";
import type { Tank } from "@/lib/domain/types";

const FISH_POSITIONS = [
  { x: 62, y: 42, scale: 0.96 },
  { x: 73, y: 55, scale: 0.82 },
  { x: 52, y: 31, scale: 0.72 },
  { x: 39, y: 46, scale: 0.88 },
  { x: 83, y: 36, scale: 0.66 },
  { x: 47, y: 52, scale: 0.78 },
  { x: 68, y: 25, scale: 0.62 },
  { x: 58, y: 38, scale: 0.7 }
];

interface PixiFishLayerProps {
  tank: Tank;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function PixiFishLayer({ tank, selectedIndex, onSelect }: PixiFishLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(selectedIndex);
  const onSelectRef = useRef(onSelect);

  selectedIndexRef.current = selectedIndex;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup = () => {};

    async function mountPixi() {
      const { Application, Assets, MeshPlane } = await import("pixi.js");
      if (disposed || !host) return;

      const app = new Application();
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2)
      });
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      app.canvas.className = "pixi-fish-canvas";
      host.appendChild(app.canvas);

      const type = tankAquariumType(tank);
      const fishItems = tank.livestock
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => inhabitantKind(item.type) === "fish" && !livestockMotion(item.name));

      const swimmers = await Promise.all(
        fishItems.map(async ({ item, index }, fishOrder) => {
          const asset = livestockImage(item, index, type);
          if (!asset) return null;

          const texture = await Assets.load(asset.startsWith("/") ? asset : `/${asset}`);
          if (disposed) return null;

          const mesh = new MeshPlane({ texture, verticesX: 9, verticesY: 3 });
          const position = FISH_POSITIONS[fishOrder % FISH_POSITIONS.length];
          const savedX = Number.parseFloat(item.tankPosition?.x || "");
          const savedY = Number.parseFloat(item.tankPosition?.y || "");
          const centerX = Number.isFinite(savedX) ? savedX : position.x;
          const centerY = Number.isFinite(savedY) ? savedY : position.y;
          const baseScale = (112 * position.scale) / Math.max(1, texture.width);
          const basePositions = new Float32Array(mesh.geometry.positions);
          const phaseOffset = fishOrder * 1.37;

          mesh.pivot.set(texture.width / 2, texture.height / 2);
          mesh.eventMode = "static";
          mesh.cursor = "pointer";
          mesh.on("pointertap", () => onSelectRef.current(index));
          app.stage.addChild(mesh);

          return {
            mesh,
            textureWidth: texture.width,
            basePositions,
            centerX,
            centerY,
            baseScale,
            phaseOffset,
            duration: 16 + (fishOrder % 4) * 3.5,
            path: 42 + (fishOrder % 3) * 11,
            arc: 7 + (fishOrder % 3) * 2,
            index
          };
        })
      );

      let elapsed = 0;
      app.ticker.add(ticker => {
        elapsed += ticker.deltaMS / 1000;

        swimmers.forEach(swimmer => {
          if (!swimmer) return;
          const phase = (elapsed / swimmer.duration) * Math.PI * 2 + swimmer.phaseOffset;
          const velocity = Math.cos(phase);
          const direction = velocity >= 0 ? 1 : -1;
          const selectedScale = selectedIndexRef.current === swimmer.index ? 1.1 : 1;

          swimmer.mesh.x = (swimmer.centerX / 100) * app.screen.width + Math.sin(phase) * swimmer.path;
          swimmer.mesh.y =
            (swimmer.centerY / 100) * app.screen.height +
            Math.sin(phase * 2 + swimmer.phaseOffset * 0.4) * swimmer.arc +
            Math.sin(elapsed * 0.72 + swimmer.phaseOffset) * 2.2;
          swimmer.mesh.scale.set(
            direction * swimmer.baseScale * selectedScale,
            swimmer.baseScale * selectedScale
          );
          swimmer.mesh.rotation = Math.sin(phase * 2 + swimmer.phaseOffset * 0.4) * 0.035;
          swimmer.mesh.alpha = selectedIndexRef.current === swimmer.index ? 1 : 0.96;

          const positions = swimmer.mesh.geometry.positions;
          const tailBeat = elapsed * (5.4 + (swimmer.index % 3) * 0.55);
          for (let vertex = 0; vertex < positions.length / 2; vertex += 1) {
            const offset = vertex * 2;
            const localX = swimmer.basePositions[offset];
            const normalizedX = localX / Math.max(1, swimmer.textureWidth);
            const tailWeight = Math.pow(1 - normalizedX, 2.4);
            positions[offset] = localX;
            positions[offset + 1] =
              swimmer.basePositions[offset + 1] +
              Math.sin(tailBeat - normalizedX * 2.8 + swimmer.phaseOffset) * 9 * (0.15 + tailWeight * 0.85);
          }
          swimmer.mesh.geometry.attributes.aPosition.buffer.update();
        });
      });

      cleanup = () => {
        app.destroy(true, { children: true, texture: false, textureSource: false });
      };
    }

    void mountPixi();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [tank.id, tank.livestock]);

  return <div className="pixi-fish-layer" ref={hostRef} aria-label="유영 중인 물고기" />;
}
