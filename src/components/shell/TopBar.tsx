"use client";

import { aquariumTypes } from "@/lib/domain/constants";
import { useActiveTank, useAppStore, type ViewId } from "@/lib/state/store";

interface TopBarProps {
  onOpenModal: (modalId: "taskModal" | "notificationModal" | "tankSettingsModal") => void;
}

function titleForView(view: ViewId, tankName: string, tankLabel: string): string {
  if (view === "dashboard") return tankName;
  if (view === "water") return "수질/환수 관리";
  if (view === "livestock") return "생물/장비 관리";
  return `${tankLabel} 도감`;
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 9.8a6 6 0 0 0-12 0c0 6-2 6.7-2 6.7h16s-2-.7-2-6.7Z" />
      <path d="M9.8 19a2.4 2.4 0 0 0 4.4 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10" />
      <path d="M13 8l4 4-4 4" />
      <path d="M17 12H9" />
    </svg>
  );
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
        <button className="topbar-icon-button" type="button" aria-label="홈으로 이동" onClick={() => setView("home")}>
          <HomeIcon />
        </button>
        <span className="topbar-action-spacer" aria-hidden="true" />
        <button
          className="topbar-icon-button"
          data-notification-settings
          type="button"
          aria-label="알림 설정"
          onClick={() => onOpenModal("notificationModal")}
        >
          <BellIcon />
        </button>
        <button
          className="topbar-icon-button"
          id="logoutButton"
          type="button"
          hidden={authMode !== "server"}
          aria-label="로그아웃"
          onClick={() => logout()}
        >
          <LogoutIcon />
        </button>
        <button className="primary-button" type="button" onClick={() => onOpenModal("taskModal")}>
          일정 추가
        </button>
      </div>

      <div className="topbar-heading">
        <p className="eyebrow" id="tankTypeEyebrow">{config.eyebrow}</p>
        <h1 id="activeTankTitle">{titleForView(view, tankName, config.label)}</h1>
      </div>
    </header>
  );
}
