"use client";

// index.html:187-227 + app.js:1006-1033, 1288-1330, 1446-1480 이식 — 수질/관리 뷰
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  currentWaterMetrics,
  formatInputValue,
  formatNumber,
  optionalNumber,
  sortedTasks,
  tankAquariumType
} from "@/lib/domain/derive";
import { todayIso } from "@/lib/domain/constants";
import type { Tank, WaterLog } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
import { TaskListItems } from "@/components/dashboard/TaskListItems";
import { PlusIcon, RefreshIcon, TrashIcon } from "@/components/ui/ActionIcons";

// index.html:195-203 — 필드 정의 (data-water-field 라벨은 metric에서 유도)
const ALL_WATER_FIELDS: { key: keyof Omit<WaterLog, "date">; digits: number }[] = [
  { key: "temp", digits: 1 },
  { key: "salinity", digits: 3 },
  { key: "kh", digits: 1 },
  { key: "ph", digits: 1 },
  { key: "gh", digits: 1 },
  { key: "no3", digits: 1 },
  { key: "nh3", digits: 1 },
  { key: "po4", digits: 2 },
  { key: "no2", digits: 1 }
];

interface WaterViewProps {
  tank: Tank;
  active: boolean;
  onOpenTaskModal: () => void;
}

export function WaterView({ tank, active, onOpenTaskModal }: WaterViewProps) {
  const upsertWaterLog = useAppStore(state => state.upsertWaterLog);
  const deleteWaterLog = useAppStore(state => state.deleteWaterLog);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const type = tankAquariumType(tank);
  const today = todayIso();
  const metrics = currentWaterMetrics(type);
  const enabledKeys = new Set(metrics.map(item => item.key));
  const editingLog = editingIndex !== null ? tank.waterLogs[editingIndex] : null;

  // app.js:1288-1302 waterLogFromForm
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v ?? "").trim()]));
    const log: WaterLog = {
      date: data.date,
      temp: optionalNumber(data.temp),
      salinity: optionalNumber(data.salinity),
      kh: optionalNumber(data.kh),
      ph: optionalNumber(data.ph),
      gh: optionalNumber(data.gh),
      no3: optionalNumber(data.no3),
      nh3: optionalNumber(data.nh3),
      po4: optionalNumber(data.po4),
      no2: optionalNumber(data.no2)
    };
    upsertWaterLog(editingIndex, log);
    setEditingIndex(null);
    setFormKey(key => key + 1);
    form.reset();
  }

  function resetWaterForm() {
    setEditingIndex(null);
    setFormKey(key => key + 1);
    formRef.current?.reset();
  }

  function editWaterLog(index: number) {
    setEditingIndex(index);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, index: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    editWaterLog(index);
  }

  const sortedRows = tank.waterLogs
    .map((log, index) => ({ ...log, index }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <section className={`view ${active ? "active" : ""}`} id="water">
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-heading">
            <h2>수질 기록</h2>
            <button className="surface-icon-button" type="button" aria-label="수질 입력 초기화" onClick={resetWaterForm}>
              <RefreshIcon />
            </button>
          </div>
          <form className="form-grid" id="waterForm" onSubmit={handleSubmit} key={`${tank.id}-${editingIndex ?? "new"}-${formKey}`} ref={formRef}>
            <label>
              날짜
              <input type="date" name="date" defaultValue={editingLog?.date || today} />
            </label>
            {ALL_WATER_FIELDS.map(field => {
              const metric = metrics.find(item => item.key === field.key);
              return (
                <label key={field.key} data-water-field={field.key} hidden={!enabledKeys.has(field.key)}>
                  {metric ? `${metric.label}${metric.unit ? ` ${metric.unit}` : ""}` : field.key}
                  <input
                    type="number"
                    step={metric?.step || "0.1"}
                    name={field.key}
                    disabled={!enabledKeys.has(field.key)}
                    defaultValue={editingLog ? formatInputValue(editingLog[field.key], metric?.digits ?? field.digits) : ""}
                  />
                </label>
              );
            })}
            <button className="primary-button wide" id="waterSubmitLabel" type="submit">
              저장
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>관리 일정</h2>
            <button className="surface-icon-button primary" type="button" aria-label="일정 추가" onClick={onOpenTaskModal}>
              <PlusIcon />
            </button>
          </div>
          <div className="timeline" id="taskTimeline">
            <TaskListItems tasks={sortedTasks(tank.tasks)} />
          </div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <h2>수질 로그</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead id="waterTableHead">
              <tr>
                <th>날짜</th>
                {metrics.map(item => (
                  <th key={item.key}>{item.label}</th>
                ))}
                <th aria-label="관리"></th>
              </tr>
            </thead>
            <tbody id="waterRows">
              {sortedRows.map(log => (
                <tr
                  key={`${log.date}-${log.index}`}
                  className="clickable-row"
                  tabIndex={0}
                  onClick={() => editWaterLog(log.index)}
                  onKeyDown={event => handleRowKeyDown(event, log.index)}
                >
                  <td>{log.date || "날짜 미정"}</td>
                  {metrics.map(item => (
                    <td key={item.key}>{formatNumber(log[item.key], item.digits)}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button
                        className="surface-icon-button danger compact"
                        type="button"
                        aria-label="수질 로그 삭제"
                        onClick={event => {
                          event.stopPropagation();
                          if (!window.confirm(`${log.date} 수질 로그를 삭제할까요?`)) return;
                          deleteWaterLog(log.index);
                          setEditingIndex(null);
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
