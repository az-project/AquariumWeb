"use client";

// index.html:229-263 + app.js:1035-1053, 1481-1548 이식 — 생물/장비 뷰
import { useState } from "react";
import { livestockImage, tankAquariumType } from "@/lib/domain/derive";
import type { Tank } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
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

  const type = tankAquariumType(tank);

  return (
    <section className={`view ${active ? "active" : ""}`} id="livestock">
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-heading">
            <h2>생물 등록</h2>
          </div>
          <LivestockForm
            tank={tank}
            editingIndex={editingLivestock}
            onSubmit={(index, item) => {
              const wasEditing = index !== null;
              upsertLivestock(index, item);
              setEditingLivestock(null);
              if (!wasEditing) setView("dashboard"); // app.js:1485
            }}
            onCancelEdit={() => setEditingLivestock(null)}
          />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>장비 상태</h2>
          </div>
          <EquipmentForm
            tank={tank}
            editingIndex={editingEquipment}
            onSubmit={(index, item) => {
              upsertEquipment(index, item);
              setEditingEquipment(null);
            }}
            onCancelEdit={() => setEditingEquipment(null)}
          />
          <div className="equipment-grid" id="equipmentGrid">
            {tank.equipment.map((item, index) => (
              <article className="equipment-item" key={`${item.name}-${index}`}>
                <strong>{item.name || "장비명 없음"}</strong>
                <small className="equipment-meta">
                  <span>{item.status || "상태 미입력"}</span>
                  <span>{item.cycle || "관리 주기 미입력"}</span>
                </small>
                <div className="row-actions">
                  <button className="text-button compact-button" type="button" onClick={() => setEditingEquipment(index)}>
                    수정
                  </button>
                  <button
                    className="text-button compact-button danger"
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`${item.name} 장비를 삭제할까요?`)) return;
                      deleteEquipment(index);
                      setEditingEquipment(null);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="creature-grid" id="livestockGrid">
        {tank.livestock.map((item, index) => {
          const asset = livestockImage(item, index, type);
          return (
            <article className="creature-card" key={`${item.name}-${index}`}>
              {asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="creature-image" src={asset} alt={item.name} />
              ) : null}
              <span className="badge">{item.type || "생물"}</span>
              <h2>{item.name || "생물 이름 없음"}</h2>
              <p>
                {item.added || "투입일 미정"} 투입 · {item.status || "상태 미입력"}
              </p>
              <small>{item.memo || "메모 없음"}</small>
              <div className="card-actions">
                <button className="text-button compact-button" type="button" onClick={() => setEditingLivestock(index)}>
                  수정
                </button>
                <button
                  className="text-button compact-button danger"
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`${item.name} 생물을 삭제할까요?`)) return;
                    deleteLivestock(index);
                    setEditingLivestock(null);
                  }}
                >
                  삭제
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
