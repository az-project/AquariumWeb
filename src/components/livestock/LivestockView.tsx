"use client";

// index.html:229-263 + app.js:1035-1053, 1481-1548 이식 — 생물/장비 뷰
import { useState } from "react";
import { livestockImage, tankAquariumType } from "@/lib/domain/derive";
import type { Tank } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
import { RefreshIcon, TrashIcon } from "@/components/ui/ActionIcons";
import { EquipmentForm, LivestockForm } from "./LivestockForms";

interface LivestockViewProps {
  tank: Tank;
  active: boolean;
}

export function LivestockView({ tank, active }: LivestockViewProps) {
  const upsertLivestock = useAppStore(state => state.upsertLivestock);
  const deleteLivestock = useAppStore(state => state.deleteLivestock);
  const upsertEquipment = useAppStore(state => state.upsertEquipment);
  const deleteEquipment = useAppStore(state => state.deleteEquipment);
  const setView = useAppStore(state => state.setView);

  const [editingLivestock, setEditingLivestock] = useState<number | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);
  const [livestockResetToken, setLivestockResetToken] = useState(0);
  const [equipmentResetToken, setEquipmentResetToken] = useState(0);

  const type = tankAquariumType(tank);

  return (
    <section className={`view ${active ? "active" : ""}`} id="livestock">
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-heading">
            <h2>생물 등록</h2>
            <button
              className="surface-icon-button"
              type="button"
              aria-label="생물 입력 초기화"
              onClick={() => {
                setEditingLivestock(null);
                setLivestockResetToken(value => value + 1);
              }}
            >
              <RefreshIcon />
            </button>
          </div>
          <LivestockForm
            tank={tank}
            editingIndex={editingLivestock}
            resetToken={livestockResetToken}
            onSubmit={(index, item) => {
              const wasEditing = index !== null;
              upsertLivestock(index, item);
              setEditingLivestock(null);
              setLivestockResetToken(value => value + 1);
              if (!wasEditing) setView("dashboard"); // app.js:1485
            }}
          />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>장비 상태</h2>
            <button
              className="surface-icon-button"
              type="button"
              aria-label="장비 입력 초기화"
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentResetToken(value => value + 1);
              }}
            >
              <RefreshIcon />
            </button>
          </div>
          <EquipmentForm
            tank={tank}
            editingIndex={editingEquipment}
            resetToken={equipmentResetToken}
            onSubmit={(index, item) => {
              upsertEquipment(index, item);
              setEditingEquipment(null);
              setEquipmentResetToken(value => value + 1);
            }}
          />
          <div className="equipment-grid" id="equipmentGrid">
            {tank.equipment.map((item, index) => (
              <article
                className="equipment-item editable-card"
                key={`${item.name}-${index}`}
                tabIndex={0}
                onClick={() => setEditingEquipment(index)}
                onKeyDown={event => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setEditingEquipment(index);
                }}
              >
                <button
                  className="surface-icon-button danger compact card-delete-button"
                  type="button"
                  aria-label="장비 삭제"
                  onClick={event => {
                    event.stopPropagation();
                    if (!window.confirm(`${item.name} 장비를 삭제할까요?`)) return;
                    deleteEquipment(index);
                    setEditingEquipment(null);
                  }}
                >
                  <TrashIcon />
                </button>
                <strong>{item.name || "장비명 없음"}</strong>
                <small className="equipment-meta">
                  <span>{item.status || "상태 미입력"}</span>
                  <span>{item.cycle || "관리 주기 미입력"}</span>
                </small>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="creature-grid" id="livestockGrid">
        {tank.livestock.map((item, index) => {
          const asset = livestockImage(item, index, type);
          return (
            <article
              className="creature-card editable-card"
              key={`${item.name}-${index}`}
              tabIndex={0}
              onClick={() => setEditingLivestock(index)}
              onKeyDown={event => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setEditingLivestock(index);
              }}
            >
              <button
                className="surface-icon-button danger compact card-delete-button"
                type="button"
                aria-label="생물 삭제"
                onClick={event => {
                  event.stopPropagation();
                  if (!window.confirm(`${item.name} 생물을 삭제할까요?`)) return;
                  deleteLivestock(index);
                  setEditingLivestock(null);
                }}
              >
                <TrashIcon />
              </button>
              {asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="creature-image" src={asset} alt={item.name} />
              ) : null}
              <span className="badge">{item.type || "생물"}</span>
              <h2>{item.name || "생물 이름 없음"}</h2>
              <dl className="creature-details">
                <div>
                  <dt>투입일</dt>
                  <dd>{item.added || "미정"}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{item.status || "미입력"}</dd>
                </div>
                <div className="creature-memo">
                  <dt>메모</dt>
                  <dd>{item.memo || "없음"}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>
    </section>
  );
}
