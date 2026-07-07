"use client";

import { aquariumTypes } from "@/lib/domain/constants";
import { useActiveTank, useAppStore, type ViewId } from "@/lib/state/store";
import { BellIcon, CalendarPlusIcon, HomeIcon, LogoutIcon } from "@/components/ui/ActionIcons";

interface TopBarProps {
  onOpenModal: (modalId: "taskModal" | "notificationModal" | "tankSettingsModal") => void;
}

function titleForView(view: ViewId, tankName: string, tankLabel: string): string {
  if (view === "dashboard") return tankName;
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
        <button
          className="topbar-icon-button topbar-icon-button-primary"
          type="button"
          aria-label="일정 추가"
          onClick={() => onOpenModal("taskModal")}
        >
          <CalendarPlusIcon />
        </button>
      </div>

      <div className="topbar-heading">
        <p className="eyebrow" id="tankTypeEyebrow">{config.eyebrow}</p>
        <h1 id="activeTankTitle">{titleForView(view, tankName, config.label)}</h1>
      </div>
    </header>
  );
}
