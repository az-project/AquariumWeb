"use client";

import { useEffect, useState } from "react";

import { aquariumBackgrounds, aquariumTypes } from "@/lib/domain/constants";
import { selectedAquariumBackground } from "@/lib/domain/derive";
import type { AquariumTypeId } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
import { BellIcon, CalendarPlusIcon, LogoutIcon } from "@/components/ui/ActionIcons";
import { Modal } from "@/components/modals/Modal";

interface TankHomeViewProps {
  onOpenModal: (modalId: "taskModal" | "notificationModal" | "tankSettingsModal") => void;
}

export function TankHomeView({ onOpenModal }: TankHomeViewProps) {
  const tanks = useAppStore(state => state.tanks);
  const switchTank = useAppStore(state => state.switchTank);
  const setView = useAppStore(state => state.setView);
  const addTank = useAppStore(state => state.addTank);
  const deleteActiveTank = useAppStore(state => state.deleteActiveTank);
  const setTankSettings = useAppStore(state => state.setTankSettings);
  const logout = useAppStore(state => state.logout);
  const authMode = useAppStore(state => state.authMode);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<AquariumTypeId | null>(null);
  const [createName, setCreateName] = useState("");
  const [createBackground, setCreateBackground] = useState("");
  const [openMenuTankId, setOpenMenuTankId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuTankId) return;

    function closeMenu() {
      setOpenMenuTankId(null);
    }

    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuTankId]);

  function openTank(tankId: string) {
    switchTank(tankId);
    setCreateOpen(false);
    setOpenMenuTankId(null);
    setView("dashboard");
  }

  function startCreateTank(type: AquariumTypeId) {
    const sameTypeCount = tanks.filter(tank => tank.aquariumType === type).length + 1;
    const defaultBackground =
      aquariumBackgrounds.find(item => item.id === aquariumTypes[type].defaultBackground) ||
      aquariumBackgrounds.find(item => item.type === (type === "freshwater" ? "담수" : "해수"));
    setCreateType(type);
    setCreateName(`${aquariumTypes[type].label} ${sameTypeCount}`);
    setCreateBackground(defaultBackground?.id || "");
    setCreateOpen(false);
    setOpenMenuTankId(null);
  }

  function closeCreateTank() {
    setCreateType(null);
    setCreateName("");
    setCreateBackground("");
  }

  function createTank() {
    if (!createType) return;
    addTank(createType, {
      name: createName,
      aquariumBackground: createBackground
    });
    closeCreateTank();
    setView("home");
  }

  function openSettings(tankId: string) {
    switchTank(tankId);
    setCreateOpen(false);
    setOpenMenuTankId(null);
    onOpenModal("tankSettingsModal");
  }

  function renameTank(tankId: string, currentName: string) {
    const nextName = window.prompt("어항 이름을 입력하세요.", currentName)?.trim();
    if (!nextName) return;
    switchTank(tankId);
    setTankSettings({ name: nextName });
    setCreateOpen(false);
    setOpenMenuTankId(null);
  }

  function deleteTank(tankId: string, tankName: string) {
    if (tanks.length <= 1) return;
    if (!window.confirm(`${tankName}을(를) 삭제할까요? 이 어항의 수질, 일정, 생물, 장비 기록이 함께 삭제됩니다.`)) return;
    switchTank(tankId);
    setCreateOpen(false);
    setOpenMenuTankId(null);
    deleteActiveTank();
  }

  return (
    <main className="tank-home" aria-label="내 어항 선택">
      <div className="tank-home-actions" aria-label="빠른 실행">
        <button
          className="tank-home-action-button"
          type="button"
          aria-label="알림 설정"
          onClick={() => onOpenModal("notificationModal")}
        >
          <BellIcon />
        </button>
        <button
          className="tank-home-action-button"
          type="button"
          hidden={authMode !== "server"}
          aria-label="로그아웃"
          onClick={() => logout()}
        >
          <LogoutIcon />
        </button>
        <button
          className="tank-home-action-button primary"
          type="button"
          aria-label="일정 추가"
          onClick={() => onOpenModal("taskModal")}
        >
          <CalendarPlusIcon />
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
              <div
                className={`tank-card-menu ${openMenuTankId === tank.id ? "open" : ""}`}
                aria-label={`${tank.name} 관리`}
                onClick={event => event.stopPropagation()}
              >
                <button
                  className="tank-card-menu-toggle"
                  type="button"
                  aria-expanded={openMenuTankId === tank.id}
                  aria-label={`${tank.name} 메뉴`}
                  onClick={() => setOpenMenuTankId(current => (current === tank.id ? null : tank.id))}
                >
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </button>
                <div className="tank-card-menu-panel">
                  <button type="button" onClick={() => renameTank(tank.id, tank.name)}>
                    이름 변경
                  </button>
                  <button type="button" onClick={() => openSettings(tank.id)}>
                    설정
                  </button>
                  <button
                    className="danger"
                    type="button"
                    disabled={!canDelete}
                    title={canDelete ? "어항 삭제" : "어항은 최소 1개가 필요합니다."}
                    onClick={() => deleteTank(tank.id, tank.name)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div className={`tank-create-fab ${createOpen ? "open" : ""}`}>
        <div className="tank-create-menu" aria-label="추가할 어항 종류">
          <button type="button" onClick={() => startCreateTank("saltwater")}>
            <span>해수</span>
            <small>산호와 해수어 관리</small>
          </button>
          <button type="button" onClick={() => startCreateTank("freshwater")}>
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
          <span className="tank-create-plus" aria-hidden="true" />
        </button>
      </div>

      <Modal id="tankCreateModal" open={createType !== null} onClose={closeCreateTank}>
        <form
          className="modal-card tank-create-modal"
          onSubmit={event => {
            event.preventDefault();
            createTank();
          }}
        >
          <div className="panel-heading">
            <div>
              <h2>새 어항</h2>
              <small>{createType ? aquariumTypes[createType].label : ""}</small>
            </div>
            <button className="icon-button" type="button" aria-label="닫기" onClick={closeCreateTank}>
              ×
            </button>
          </div>
          <label>
            어항 이름
            <input
              name="tankName"
              value={createName}
              maxLength={30}
              onChange={event => setCreateName(event.target.value)}
            />
          </label>
          <div className="background-picker">
            <div className="background-picker-heading">
              <span>배경 선택</span>
            </div>
            <div className="background-options">
              {aquariumBackgrounds
                .filter(item => item.type === (createType === "freshwater" ? "담수" : "해수"))
                .map(item => (
                  <button
                    key={item.id}
                    className={item.id === createBackground ? "active" : ""}
                    type="button"
                    aria-pressed={item.id === createBackground}
                    onClick={() => setCreateBackground(item.id)}
                  >
                    <span className="background-thumb" style={{ backgroundImage: `url('${item.src}')` }} />
                    <span className="background-label">{item.label}</span>
                  </button>
                ))}
            </div>
          </div>
          <button className="primary-button wide" type="submit">
            생성
          </button>
        </form>
      </Modal>
    </main>
  );
}
