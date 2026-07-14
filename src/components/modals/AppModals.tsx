"use client";

// index.html:297-380 + app.js:1549-1618 이식 — 모달 4종
import { useEffect, useState, type FormEvent } from "react";
import { aquariumBackgrounds, aquariumTypes, todayIso } from "@/lib/domain/constants";
import { selectedAquariumBackground, tankAquariumType } from "@/lib/domain/derive";
import type { NotificationSettings, Tank } from "@/lib/domain/types";
import { useAppStore } from "@/lib/state/store";
import { livestockFromFormData } from "@/components/livestock/LivestockForms";
import { SpeciesSelect } from "@/components/livestock/SpeciesSelect";
import { Modal } from "./Modal";

export type ModalId = "taskModal" | "creatureModal" | "notificationModal" | "tankSettingsModal";

function cleanFormData(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value ?? "").trim()]));
}

interface AppModalsProps {
  tank: Tank;
  openModal: ModalId | null;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  notificationStatusText: string;
  onSaveNotificationSettings: (settings: NotificationSettings) => Promise<unknown>;
  onTestNotification: () => Promise<unknown>;
}

export function AppModals({
  tank,
  openModal,
  onClose,
  notificationSettings,
  notificationStatusText,
  onSaveNotificationSettings,
  onTestNotification
}: AppModalsProps) {
  const addTask = useAppStore(state => state.addTask);
  const upsertLivestock = useAppStore(state => state.upsertLivestock);
  const setTankSettings = useAppStore(state => state.setTankSettings);

  const [quickSpecies, setQuickSpecies] = useState("");
  const [settingsName, setSettingsName] = useState(tank.name);
  const [settingsBackground, setSettingsBackground] = useState(selectedAquariumBackground(tank).id);

  const type = tankAquariumType(tank);
  const today = todayIso();
  const config = aquariumTypes[type];
  const typeLabel = type === "freshwater" ? "담수" : "해수";
  const backgroundOptions = aquariumBackgrounds.filter(item => item.type === typeLabel);
  const currentBackground = selectedAquariumBackground(tank);

  useEffect(() => {
    if (openModal !== "tankSettingsModal") return;
    setSettingsName(tank.name || config.defaultName);
    setSettingsBackground(currentBackground.id);
  }, [openModal, tank.id, tank.name, config.defaultName, currentBackground.id]);

  // app.js:1554-1563
  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = cleanFormData(event.currentTarget);
    addTask({
      title: data.title || "작업명 없음",
      category: data.category || "분류 없음",
      due: data.due || "",
      memo: data.memo || ""
    });
    event.currentTarget.reset();
    onClose();
  }

  // app.js:1549-1552
  function handleQuickLivestockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = cleanFormData(event.currentTarget);
    upsertLivestock(null, livestockFromFormData(data, tank));
    event.currentTarget.reset();
    setQuickSpecies("");
    onClose();
  }

  // app.js:1598-1614
  async function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    await onSaveNotificationSettings({
      enabled: data.enabled === "on",
      time: data.time || "09:00",
      leadDays: Number(data.leadDays ?? 1)
    });
    onClose();
  }

  function handleTankSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTankSettings({
      name: settingsName.trim() || config.defaultName,
      aquariumBackground: settingsBackground
    });
    onClose();
  }

  return (
    <>
      <Modal id="taskModal" open={openModal === "taskModal"} onClose={onClose}>
        <form method="dialog" className="modal-card" id="taskForm" onSubmit={handleTaskSubmit}>
          <div className="panel-heading">
            <h2>관리 일정 추가</h2>
            <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
              ×
            </button>
          </div>
          <label>
            작업명
            <input name="title" placeholder="예: 20% 환수" />
          </label>
          <label>
            분류
            <select name="category">
              <option>환수</option>
              <option>먹이</option>
              <option>첨가제</option>
              <option>장비</option>
              <option>검역</option>
            </select>
          </label>
          <label>
            예정일
            <input type="date" name="due" />
          </label>
          <label>
            메모
            <input name="memo" placeholder="소금량, 교체 부품 등" />
          </label>
          <button className="primary-button wide" value="default" type="submit">
            저장
          </button>
        </form>
      </Modal>

      <Modal id="creatureModal" open={openModal === "creatureModal"} onClose={onClose}>
        <form method="dialog" className="modal-card" id="quickLivestockForm" onSubmit={handleQuickLivestockSubmit}>
          <div className="panel-heading">
            <h2>생물 빠른 추가</h2>
            <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
              ×
            </button>
          </div>
          <SpeciesSelect aquariumType={type} value={quickSpecies} onChange={setQuickSpecies} />
          <label>
            투입일
            <input type="date" name="added" defaultValue={today} />
          </label>
          <label>
            상태
            <select name="status">
              <option>건강</option>
              <option>관찰</option>
              <option>격리</option>
            </select>
          </label>
          <label>
            메모
            <input name="memo" placeholder="먹이 반응, 위치, 성격 등" />
          </label>
          <button className="primary-button wide" value="default" type="submit">
            어항에 추가
          </button>
        </form>
      </Modal>

      <Modal id="notificationModal" open={openModal === "notificationModal"} onClose={onClose}>
        <form
          method="dialog"
          className="modal-card notification-card"
          id="notificationForm"
          onSubmit={handleNotificationSubmit}
          key={`${notificationSettings.enabled}-${notificationSettings.time}-${notificationSettings.leadDays}`}
        >
          <div className="panel-heading">
            <h2>푸시 알림 설정</h2>
            <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="notification-status" id="notificationStatus">
            {notificationStatusText}
          </div>
          <label className="switch-row">
            <input type="checkbox" id="notifyEnabled" name="enabled" defaultChecked={notificationSettings.enabled} />
            <span>
              <strong>관리 일정 알림</strong>
              <small>예정된 환수, 먹이, 장비 점검을 지정 시간에 알려줍니다.</small>
            </span>
          </label>
          <div className="form-grid">
            <label>
              알림 시간
              <input type="time" id="notifyTime" name="time" defaultValue={notificationSettings.time} />
            </label>
            <label>
              사전 알림
              <select id="notifyLeadDays" name="leadDays" defaultValue={String(notificationSettings.leadDays)}>
                <option value="0">당일</option>
                <option value="1">1일 전</option>
                <option value="3">3일 전</option>
                <option value="7">7일 전</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button className="text-button" id="testNotification" type="button" onClick={() => void onTestNotification()}>
              테스트 알림
            </button>
            <button className="primary-button" value="default" type="submit">
              설정 저장
            </button>
          </div>
        </form>
      </Modal>

      <Modal id="tankSettingsModal" open={openModal === "tankSettingsModal"} onClose={onClose}>
        <form className="modal-card tank-settings-modal" onSubmit={handleTankSettingsSubmit}>
          <div className="panel-heading">
            <div>
              <h2>어항 설정</h2>
              <small id="tankSettingsSubtitle">{`${tank.name || config.defaultName} · ${config.label}`}</small>
            </div>
            <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
              ×
            </button>
          </div>
          <label>
            어항 이름
            <input
              name="tankName"
              value={settingsName}
              maxLength={30}
              onChange={event => setSettingsName(event.target.value)}
            />
          </label>
          <div className="background-picker" aria-label="어항 배경 선택">
            <div className="background-picker-heading">
              <span>배경 선택</span>
            </div>
            <div className="background-options" id="backgroundOptions">
              {backgroundOptions.map(item => (
                <button
                  key={item.id}
                  className={item.id === settingsBackground ? "active" : ""}
                  data-background-id={item.id}
                  type="button"
                  title={item.label}
                  aria-pressed={item.id === settingsBackground}
                  onClick={() => setSettingsBackground(item.id)}
                >
                  <span className="background-thumb" style={{ backgroundImage: `url('${item.src}')` }} />
                  <span className="background-label">{item.label}</span>
                  <small>{item.type}</small>
                </button>
              ))}
            </div>
          </div>
          <button className="primary-button wide" type="submit">
            저장
          </button>
        </form>
      </Modal>
    </>
  );
}
