"use client";

// index.html:95-185 + app.js:571-623, 723-735 이식 — 대시보드 뷰
import { aquariumTypes, todayIso } from "@/lib/domain/constants";
import {
  currentWaterMetrics,
  daysBetween,
  formatMetric,
  isValidDateString,
  latestLog,
  selectedAquariumBackground,
  sortedTasks,
  stabilityScore,
  tankAquariumType
} from "@/lib/domain/derive";
import type { Tank } from "@/lib/domain/types";
import { useAppStore, type ViewId } from "@/lib/state/store";
import { AquariumVisual } from "./AquariumVisual";
import { TaskListItems } from "./TaskListItems";
import { WaterChart } from "./WaterChart";

interface DashboardViewProps {
  tank: Tank;
  active: boolean;
  onOpenModal: (modalId: "creatureModal" | "tankSettingsModal") => void;
}

export function DashboardView({ tank, active, onOpenModal }: DashboardViewProps) {
  const setView = useAppStore(state => state.setView);
  const selectedLivestockIndex = useAppStore(state => state.selectedLivestockIndex);

  const type = tankAquariumType(tank);
  const config = aquariumTypes[type];
  const metrics = currentWaterMetrics(type);
  const latest = latestLog(tank.waterLogs);
  const today = todayIso();

  const secondary = metrics.find(item => item.key === config.secondaryMetric) || metrics[1];
  const nextWater = tank.tasks
    .filter(t => t.category === "환수" && isValidDateString(t.due))
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const dday = nextWater ? daysBetween(nextWater.due, today) : null;
  const ddayText = dday === null ? "-" : dday === 0 ? "오늘" : `D${dday > 0 ? "-" + dday : "+" + Math.abs(dday)}`;
  const score = stabilityScore(latest, type);
  const taskCount = tank.tasks.filter(t => isValidDateString(t.due) && daysBetween(t.due, today) <= 7).length;
  const todayTasks = sortedTasks(tank.tasks.filter(t => isValidDateString(t.due) && t.due <= today)).slice(0, 5);
  const background = selectedAquariumBackground(tank);

  const selectedItem =
    selectedLivestockIndex !== null && Number.isInteger(selectedLivestockIndex)
      ? tank.livestock[selectedLivestockIndex] || null
      : null;

  const jumpTo = (view: ViewId) => () => setView(view);

  return (
    <section className={`view ${active ? "active" : ""}`} id="dashboard">
      <div className="dashboard-hero">
        <AquariumVisual tank={tank} onOpenTankSettings={() => onOpenModal("tankSettingsModal")} />
        <aside className="status-rail" aria-label="어항 주요 상태">
          <div className="rail-heading">
            <p className="eyebrow">Live Reef Monitor</p>
            <h2>내 어항 생물 지도</h2>
          </div>
          <div className="tank-settings-summary">
            <span>현재 배경</span>
            <strong id="currentBackgroundName">{background.label}</strong>
            <small>어항 이미지 우상단 설정에서 변경</small>
          </div>
          <div className="tank-stat">
            <span className="stat-icon">°C</span>
            <div>
              <span>수온</span>
              <strong id="heroTemp">{formatMetric(latest.temp, 1, "°C")}</strong>
            </div>
          </div>
          <div className="tank-stat">
            <span className="stat-icon" id="heroSecondaryUnit">{secondary.unit || secondary.label}</span>
            <div>
              <span id="heroSecondaryLabel">{secondary.label}</span>
              <strong id="heroSalinity">{formatMetric(latest[secondary.key], secondary.digits, secondary.unit)}</strong>
            </div>
          </div>
          <div className="tank-stat">
            <span className="stat-icon">D</span>
            <div>
              <span>환수 D-day</span>
              <strong id="heroWaterChange">{ddayText}</strong>
            </div>
          </div>
          <div className="tank-inspector" aria-label="선택한 생물 정보">
            <span>선택 생물</span>
            <strong id="selectedCreatureName">
              {selectedItem ? selectedItem.name : `${tank.livestock.length}마리/개체 표시 중`}
            </strong>
            <small id="selectedCreatureMeta">
              {selectedItem
                ? `${selectedItem.type} · ${selectedItem.status} · ${selectedItem.added} 투입${selectedItem.memo ? " · " + selectedItem.memo : ""}`
                : "어항 안 생물을 누르면 투입일, 상태, 메모를 확인할 수 있습니다."}
            </small>
          </div>
          <button className="primary-button wide" onClick={() => onOpenModal("creatureModal")}>
            생물 추가
          </button>
        </aside>
      </div>

      <div className="metric-grid">
        <article className="metric-card good">
          <span>수질 안정도</span>
          <strong id="stabilityScore">{score === null ? "-" : `${score}점`}</strong>
          <small id="stabilityText">
            {score === null ? "수질 기록 없음" : score >= 85 ? "아주 안정적" : score >= 70 ? "관찰 권장" : "조정 필요"}
          </small>
        </article>
        <article className="metric-card">
          <span>등록 생물</span>
          <strong id="livestockCount">{tank.livestock.length}</strong>
          <small id="livestockMetricHelp">{config.livestockHelp}</small>
        </article>
        <article className="metric-card warn">
          <span>예정 작업</span>
          <strong id="taskCount">{taskCount}</strong>
          <small>7일 이내</small>
        </article>
        <article className="metric-card">
          <span>운영 일수</span>
          <strong id="tankDays">{`${Math.max(1, daysBetween(today, tank.tankStart))}일`}</strong>
          <small>세팅일 기준</small>
        </article>
      </div>

      <div className="content-grid dashboard-insights">
        <section className="panel">
          <div className="panel-heading">
            <h2>오늘 할 일</h2>
            <button className="text-button" data-view-jump="water" onClick={jumpTo("water")}>
              관리하기
            </button>
          </div>
          <div className="task-list" id="todayTasks">
            <TaskListItems tasks={todayTasks} />
          </div>
        </section>
      </div>
      <section className="panel chart-panel">
        <div className="panel-heading">
          <h2>최근 수질 추이</h2>
          <button className="text-button" data-view-jump="water" onClick={jumpTo("water")}>
            기록 추가
          </button>
        </div>
        <WaterChart waterLogs={tank.waterLogs} aquariumType={type} visible={active} />
      </section>
    </section>
  );
}
