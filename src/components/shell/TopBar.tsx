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
  const view = useAppStore(state => state.view);
  const setView = useAppStore(state => state.setView);
  const logout = useAppStore(state => state.logout);
  const authMode = useAppStore(state => state.authMode);
  const activeTank = useActiveTank();

  const config = aquariumTypes[activeTank?.aquariumType || "saltwater"];
  const tankName = activeTank?.name || config.defaultName;

  return (
    <header className="topbar">
      <div className="topbar-actions" aria-label="빠른 실행">
        <button className="text-button" data-notification-settings type="button" onClick={() => onOpenModal("notificationModal")}>
          알림
        </button>
        <button className="text-button" id="logoutButton" type="button" hidden={authMode !== "server"} onClick={() => logout()}>
          로그아웃
        </button>
        <button className="primary-button" type="button" onClick={() => onOpenModal("taskModal")}>
          일정 추가
        </button>
      </div>

      <div className="topbar-heading">
        <p className="eyebrow" id="tankTypeEyebrow">{config.eyebrow}</p>
        <h1 id="activeTankTitle">{titleForView(view, tankName, config.label)}</h1>
        <div className="active-tank-summary" aria-label="현재 선택된 어항">
          <button className="tank-home-link" type="button" onClick={() => setView("home")}>
            내 어항
          </button>
          <strong>{tankName}</strong>
          <small>{config.label}</small>
        </div>
      </div>
    </header>
  );
}
