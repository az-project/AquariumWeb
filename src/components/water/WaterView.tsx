"use client";

// index.html:187-227 + app.js:1006-1033, 1288-1330, 1446-1480 이식 — 수질/관리 뷰
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  currentWaterMetrics,
  formatInputValue,
  formatNumber,
  hasNumber,
  idealRangeNote,
  idealRangeText,
  isWithinIdealRange,
  optionalNumber,
  sortedTasks,
  tankAquariumType
} from "@/lib/domain/derive";
import { todayIso } from "@/lib/domain/constants";
import type { Tank, WaterLog } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
import { TaskListItems } from "@/components/dashboard/TaskListItems";
import { PlusIcon, RefreshIcon, TrashIcon } from "@/components/ui/ActionIcons";

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
  const editingLog = editingIndex !== null ? tank.waterLogs[editingIndex] : null;

  // app.js:1288-1302 waterLogFromForm
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v ?? "").trim()]));
    const log = metrics.reduce<WaterLog>(
      (nextLog, metric) => ({
        ...nextLog,
        [metric.key]: optionalNumber(data[metric.key])
      }),
      { date: data.date }
    );
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
            {metrics.map(metric => {
              return (
                <label key={metric.key} data-water-field={metric.key}>
                  {`${metric.label}${metric.unit ? ` ${metric.unit}` : ""}`}
                  <input
                    type="number"
                    step={metric.step || "0.1"}
                    name={metric.key}
                    defaultValue={editingLog ? formatInputValue(editingLog[metric.key], metric.digits) : ""}
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
                  {metrics.map(item => {
                    const rawValue = log[item.key];
                    const value = hasNumber(rawValue) ? Number(rawValue) : null;
                    const rangeText = idealRangeText(item);
                    const rangeNote = idealRangeNote(value, item);
                    const isOutOfRange = value !== null && !isWithinIdealRange(value, item);
                    const formattedValue = formatNumber(value, item.digits);
                    return (
                      <td key={item.key}>
                        <span
                          className={`water-log-value ${isOutOfRange ? "is-out-of-range" : ""} ${rangeText ? "has-range-tip" : ""}`}
                          aria-label={
                            rangeText
                              ? `${item.label} ${formattedValue}, 적정범위 ${rangeText}, 참고내용 ${rangeNote}`
                              : `${item.label} ${formattedValue}`
                          }
                        >
                          {formattedValue}
                          {rangeText ? (
                            <span className="water-range-tooltip" role="tooltip">
                              <span>
                                <strong>적정범위</strong>
                                <em>{rangeText}</em>
                              </span>
                              <span>
                                <strong>참고내용</strong>
                                <em>{rangeNote}</em>
                              </span>
                            </span>
                          ) : null}
                        </span>
                      </td>
                    );
                  })}
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
