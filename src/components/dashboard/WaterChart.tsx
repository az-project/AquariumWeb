"use client";

// app.js:1065-1246, 1437-1445 이식 — 캔버스 수질 차트.
// DPR 스케일, 최근 14개 로그, 최근접 hit-test 툴팁, 리사이즈 120ms 디바운스까지
// 바닐라 동작을 그대로 유지한다 (recharts 등 라이브러리 미사용).
import { useCallback, useEffect, useRef } from "react";
import { currentWaterMetrics, formatNumber, hasNumber, sortedLogs } from "@/lib/domain/derive";
import type { AquariumTypeId, WaterLog, WaterMetric } from "@/lib/domain/types";

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
  label: string;
  color: string;
  formatted: string;
}

interface WaterChartProps {
  waterLogs: WaterLog[];
  aquariumType: AquariumTypeId;
  visible: boolean;
}

function resizeChartCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width < 20 || height < 20) return null;

  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const nextWidth = Math.round(width * dpr);
  const nextHeight = Math.round(height * dpr);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

function plotSeries(
  ctx: CanvasRenderingContext2D,
  logs: WaterLog[],
  item: WaterMetric,
  plotArea: { left: number; right: number; top: number; bottom: number },
  chartPoints: ChartPoint[]
) {
  const plotWidth = plotArea.right - plotArea.left;
  const plotHeight = plotArea.bottom - plotArea.top;
  const xStep = logs.length > 1 ? plotWidth / (logs.length - 1) : 0;
  const points = logs
    .map((log, index) => {
      if (!hasNumber(log[item.key])) return null;
      const value = Number(log[item.key]);
      const ratio = Math.min(1, Math.max(0, (value - item.min) / (item.max - item.min)));
      return {
        x: plotArea.left + xStep * index,
        y: plotArea.bottom - ratio * plotHeight,
        value,
        date: log.date || "날짜 미정",
        label: item.label,
        color: item.color,
        formatted: `${formatNumber(value, item.digits)}${item.unit}`
      };
    })
    .filter((point): point is ChartPoint => Boolean(point));
  if (!points.length) return;

  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  chartPoints.push(...points);
}

export function WaterChart({ waterLogs, aquariumType, visible }: WaterChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartPointsRef = useRef<ChartPoint[]>([]);

  const series = currentWaterMetrics(aquariumType);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = resizeChartCanvas(canvas);
    if (!size) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    chartPointsRef.current = [];
    const logs = sortedLogs(waterLogs)
      .filter(log => series.some(item => hasNumber(log[item.key])))
      .slice(-14);
    const { width, height } = size;
    const isCompact = width < 430;
    const plotArea = {
      left: isCompact ? 24 : 54,
      right: width - (isCompact ? 12 : 24),
      top: isCompact ? 28 : 46,
      bottom: height - (isCompact ? 40 : 58)
    };
    const plotHeight = plotArea.bottom - plotArea.top;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7fbfb";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#d9e7e8";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = plotArea.top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(plotArea.left, y);
      ctx.lineTo(plotArea.right, y);
      ctx.stroke();
    }

    if (!logs.length) {
      ctx.fillStyle = "#6c817e";
      ctx.font = `${isCompact ? 14 : 18}px Segoe UI, Malgun Gothic, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("수질 기록을 추가하면 그래프가 표시됩니다.", width / 2, height / 2);
      return;
    }

    series.forEach(item => plotSeries(ctx, logs, item, plotArea, chartPointsRef.current));

    ctx.fillStyle = "#8aa09d";
    ctx.font = `${isCompact ? 11 : 13}px Segoe UI, Malgun Gothic, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(logs[0]?.date || "시작", plotArea.left, height - 24);
    ctx.textAlign = "right";
    ctx.fillText(logs[logs.length - 1]?.date || "최근", plotArea.right, height - 24);
  }, [waterLogs, series]);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.hidden = true;
  }, []);

  // app.js:1187-1241 — 최근접 포인트 + 겹침 그룹핑 툴팁 (ref 기반 DOM 조작 유지)
  const showTooltip = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const tooltip = tooltipRef.current;
      const chartPoints = chartPointsRef.current;
      if (!canvas || !tooltip || !chartPoints.length) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let nearest: ChartPoint | null = null;
      let nearestDistance = Infinity;
      const hitRadius = 34;
      const overlapRadius = 18;

      chartPoints.forEach(point => {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < nearestDistance) {
          nearest = point;
          nearestDistance = distance;
        }
      });

      if (!nearest || nearestDistance > hitRadius) {
        hideTooltip();
        return;
      }
      const anchorPoint: ChartPoint = nearest;

      const visiblePoints = chartPoints
        .filter(point => Math.hypot(point.x - anchorPoint.x, point.y - anchorPoint.y) <= overlapRadius)
        .sort((a, b) => a.label.localeCompare(b.label, "ko"));
      const anchor = visiblePoints.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
      anchor.x /= visiblePoints.length;
      anchor.y /= visiblePoints.length;

      const tooltipWidth = 220;
      const left = Math.min(Math.max(anchor.x, tooltipWidth / 2 + 8), rect.width - tooltipWidth / 2 - 8);
      const top = Math.max(anchor.y, 72);
      tooltip.hidden = false;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.innerHTML = `
        <span class="chart-tooltip-date">${anchorPoint.date.replace(/[&<>"]/g, "")}</span>
        ${visiblePoints
          .map(
            point => `
          <span class="chart-tooltip-row">
            <i style="background:${point.color}"></i>
            <strong>${point.label.replace(/[&<>"]/g, "")}</strong>
            <span>${point.formatted.replace(/[&<>"]/g, "")}</span>
          </span>`
          )
          .join("")}
      `;
    },
    [hideTooltip]
  );

  useEffect(() => {
    if (!visible) return;
    // 뷰 전환 직후 캔버스 크기가 잡힌 뒤 그리기 (app.js:1431 rAF와 동일)
    const frame = requestAnimationFrame(drawChart);
    return () => cancelAnimationFrame(frame);
  }, [drawChart, visible]);

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        hideTooltip();
        drawChart();
      }, 120);
    }
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [drawChart, hideTooltip]);

  return (
    <div className="chart-canvas-wrap">
      <div className="chart-legend" id="chartLegend" aria-label="수질 그래프 항목">
        {series.map(item => (
          <span key={item.key} className="chart-legend-item">
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <canvas
        id="waterChart"
        ref={canvasRef}
        width={1200}
        height={520}
        aria-label="최근 수질 그래프"
        onMouseMove={showTooltip}
        onMouseLeave={hideTooltip}
      />
      <div className="chart-tooltip" id="chartTooltip" ref={tooltipRef} role="status" aria-live="polite" hidden />
    </div>
  );
}
