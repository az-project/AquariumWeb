"use client";

import { aquariumTypes } from "@/lib/domain/constants";
import { selectedAquariumBackground } from "@/lib/domain/derive";
import { useAppStore } from "@/lib/state/store";
import type { AquariumTypeId } from "@/lib/domain/types";
import { useState } from "react";

interface TankHomeViewProps {
  onOpenModal: (modalId: "taskModal" | "notificationModal" | "tankSettingsModal") => void;
}

export function TankHomeView({ onOpenModal }: TankHomeViewProps) {
  const tanks = useAppStore(state => state.tanks);
  const switchTank = useAppStore(state => state.switchTank);
  const setView = useAppStore(state => state.setView);
  const addTank = useAppStore(state => state.addTank);
  const deleteActiveTank = useAppStore(state => state.deleteActiveTank);
  const logout = useAppStore(state => state.logout);
  const authMode = useAppStore(state => state.authMode);
  const [createOpen, setCreateOpen] = useState(false);

  function openTank(tankId: string) {
    switchTank(tankId);
    setView("dashboard");
  }

  function createTank(type: AquariumTypeId) {
    addTank(type);
    setCreateOpen(false);
    setView("dashboard");
  }

  function openSettings(tankId: string) {
    switchTank(tankId);
    onOpenModal("tankSettingsModal");
  }

  function deleteTank(tankId: string, tankName: string) {
    if (tanks.length <= 1) return;
    if (!window.confirm(`${tankName}을(를) 삭제할까요? 이 어항의 수질, 일정, 생물, 장비 기록이 함께 삭제됩니다.`)) return;
    switchTank(tankId);
    deleteActiveTank();
  }

  return (
    <main className="tank-home" aria-label="내 어항 선택">
      <div className="tank-home-actions" aria-label="빠른 실행">
        <button className="text-button" type="button" onClick={() => onOpenModal("notificationModal")}>
          알림
        </button>
        <button className="text-button" type="button" hidden={authMode !== "server"} onClick={() => logout()}>
          로그아웃
        </button>
        <button className="primary-button" type="button" onClick={() => onOpenModal("taskModal")}>
          일정 추가
        </button>
      </div>

      <section className="tank-home-hero">
        <p className="eyebrow">My Aquariums</p>
        <h1>내 어항</h1>
        <p>관리할 어항을 선택하세요.</p>
      </section>

      <section className="tank-card-grid" aria-label="어항 목록">
        {tanks.map(tank => {
          const config = aquariumTypes[tank.aquariumType];
          const background = selectedAquariumBackground(tank);
          const canDelete = tanks.length > 1;

          return (
            <article key={tank.id} className="tank-home-card">
              <button className="tank-card-open" type="button" onClick={() => openTank(tank.id)}>
                <img src={background.src} alt="" />
                <span className="tank-card-shade" aria-hidden="true" />
                <span className="tank-card-content">
                  <small>{config.label}</small>
                  <strong>{tank.name}</strong>
                  <em>{background.label}</em>
                </span>
                <span className="tank-card-stats" aria-hidden="true">
                  <span>{tank.livestock.length} 생물</span>
                  <span>{tank.waterLogs.length} 수질</span>
                  <span>{tank.tasks.length} 일정</span>
                </span>
              </button>
              <div className="tank-card-actions" aria-label={`${tank.name} 관리`}>
                <button className="tank-card-action" type="button" onClick={() => openSettings(tank.id)}>
                  설정
                </button>
                <button
                  className="tank-card-action danger"
                  type="button"
                  disabled={!canDelete}
                  title={canDelete ? "어항 삭제" : "어항은 최소 1개가 필요합니다."}
                  onClick={() => deleteTank(tank.id, tank.name)}
                >
                  삭제
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <div className={`tank-create-fab ${createOpen ? "open" : ""}`}>
        <div className="tank-create-menu" aria-label="추가할 어항 종류">
          <button type="button" onClick={() => createTank("saltwater")}>
            <span>해수</span>
            <small>산호와 해수어 관리</small>
          </button>
          <button type="button" onClick={() => createTank("freshwater")}>
            <span>담수</span>
            <small>수초와 담수어 관리</small>
          </button>
        </div>
        <button
          className="tank-create-button"
          type="button"
          aria-expanded={createOpen}
          aria-label="어항 추가"
          onClick={() => setCreateOpen(open => !open)}
        >
          +
        </button>
      </div>
    </main>
  );
}
