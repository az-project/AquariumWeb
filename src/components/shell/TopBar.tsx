"use client";

import { aquariumTypes } from "@/lib/domain/constants";
import { useActiveTank, useAppStore, type ViewId } from "@/lib/state/store";

interface TopBarProps {
  onOpenModal: (modalId: "taskModal" | "notificationModal" | "tankSettingsModal") => void;
}

function titleForView(view: ViewId, tankName: string, tankLabel: string): string {
  if (view === "dashboard") return `${tankName} 상태`;
  if (view === "water") return "수질/환수 관리";
  if (view === "livestock") return "생물/장비 관리";
  return `${tankLabel} 도감`;
}

export function TopBar({ onOpenModal }: TopBarProps) {
  const tanks = useAppStore(state => state.tanks);
  const activeTankId = useAppStore(state => state.activeTankId);
  const view = useAppStore(state => state.view);
  const switchTank = useAppStore(state => state.switchTank);
  const addTank = useAppStore(state => state.addTank);
  const deleteActiveTank = useAppStore(state => state.deleteActiveTank);
  const logout = useAppStore(state => state.logout);
  const authMode = useAppStore(state => state.authMode);
  const activeTank = useActiveTank();

  const config = aquariumTypes[activeTank?.aquariumType || "saltwater"];
  const tankName = activeTank?.name || config.defaultName;
  const canDelete = tanks.length > 1;
  const isDashboard = view === "dashboard";

  function handleDelete() {
    if (!canDelete) return;
    if (!window.confirm(`${tankName}을(를) 삭제할까요? 이 어항의 수질, 일정, 생물, 장비 기록이 함께 삭제됩니다.`)) return;
    deleteActiveTank();
  }

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <p className="eyebrow" id="tankTypeEyebrow">{config.eyebrow}</p>
        <h1 id="activeTankTitle">{titleForView(view, tankName, config.label)}</h1>
        {isDashboard ? (
          <div className="tank-switcher" aria-label="관리 어항 선택">
            <div className="tank-select-wrap">
              <span>관리 어항</span>
              <select id="tankSelect" value={activeTankId} onChange={event => switchTank(event.target.value)}>
                {tanks.map(tank => (
                  <option key={tank.id} value={tank.id}>
                    {tank.name} · {aquariumTypes[tank.aquariumType]?.label || "어항"}
                  </option>
                ))}
              </select>
            </div>
            <div className="tank-actions">
              <button className="chip-button salt" id="addSaltwaterTank" data-mobile-label="+해수" type="button" onClick={() => addTank("saltwater")}>
                + 해수
              </button>
              <button className="chip-button fresh" id="addFreshwaterTank" data-mobile-label="+담수" type="button" onClick={() => addTank("freshwater")}>
                + 담수
              </button>
              <button className="chip-button settings" data-mobile-label="설정" type="button" onClick={() => onOpenModal("tankSettingsModal")}>
                어항 설정
              </button>
              <button
                className="chip-button danger"
                id="deleteTank"
                data-mobile-label="삭제"
                type="button"
                disabled={!canDelete}
                title={canDelete ? "현재 선택한 어항 삭제" : "어항은 최소 1개가 필요합니다."}
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div className="active-tank-summary" aria-label="현재 선택된 어항">
            <span>현재 어항</span>
            <strong>{tankName}</strong>
            <small>{config.label}</small>
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <button className="text-button" data-notification-settings data-mobile-label="알림" type="button" onClick={() => onOpenModal("notificationModal")}>
          알림 설정
        </button>
        <button className="text-button" id="logoutButton" data-mobile-label="로그아웃" type="button" hidden={authMode !== "server"} onClick={() => logout()}>
          로그아웃
        </button>
        <button className="primary-button" data-mobile-label="일정 추가" onClick={() => onOpenModal("taskModal")}>
          관리 일정 추가
        </button>
      </div>
    </header>
  );
}
