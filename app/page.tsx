"use client";

// 앱 엔트리 — 바닐라 부트스트랩(app.js:1625-1631) 대응.
import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LibraryView } from "@/components/library/LibraryView";
import { LivestockView } from "@/components/livestock/LivestockView";
import { AppModals, type ModalId } from "@/components/modals/AppModals";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { WaterView } from "@/components/water/WaterView";
import { useNotifications } from "@/hooks/useNotifications";
import { nextDueText } from "@/lib/domain/derive";
import { useActiveTank, useAppStore } from "@/lib/state/store";

export default function Home() {
  const authStatus = useAppStore(state => state.authStatus);
  const view = useAppStore(state => state.view);
  const initialize = useAppStore(state => state.initialize);
  const activeTank = useActiveTank();
  const [openModal, setOpenModal] = useState<ModalId | null>(null);

  const notifications = useNotifications(activeTank?.tasks || []);

  useEffect(() => {
    void initialize();
    // 기존 바닐라 PWA의 서비스워커 해제 (킬스위치 SW와 이중 방어)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations => registrations.forEach(registration => void registration.unregister()))
        .catch(() => {});
    }
  }, [initialize]);

  if (authStatus === "checking") {
    return null;
  }

  if (authStatus === "locked") {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        nextReminderText={nextDueText(activeTank.tasks)}
        notificationSummary={notifications.summaryText}
        onOpenNotificationSettings={() => setOpenModal("notificationModal")}
      />
      <main className="main-area">
        <TopBar onOpenModal={setOpenModal} />

        <DashboardView tank={activeTank} active={view === "dashboard"} onOpenModal={setOpenModal} />
        <WaterView tank={activeTank} active={view === "water"} onOpenTaskModal={() => setOpenModal("taskModal")} />
        <LivestockView tank={activeTank} active={view === "livestock"} />
        <LibraryView tank={activeTank} active={view === "library"} />
      </main>

      <AppModals
        tank={activeTank}
        openModal={openModal}
        onClose={() => setOpenModal(null)}
        notificationSettings={notifications.settings}
        notificationStatusText={notifications.statusText}
        onSaveNotificationSettings={notifications.saveSettings}
        onTestNotification={() => notifications.showReminder(true)}
      />
    </div>
  );
}
