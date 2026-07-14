"use client";

// app.js:737-807 이식 — 생물 등록/수정 폼과 장비 폼 (uncontrolled + FormData 패턴 유지)
import { useEffect, useState, type FormEvent } from "react";
import { todayIso } from "@/lib/domain/constants";
import { availableSpecies, livestockImage, tankAquariumType } from "@/lib/domain/derive";
import type { Equipment, Livestock, Tank } from "@/lib/domain/types";
import { SpeciesSelect } from "./SpeciesSelect";

function cleanFormData(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value ?? "").trim()]));
}

/** app.js:737-756 addLivestockFromForm — 폼 데이터 → Livestock */
export function livestockFromFormData(data: Record<string, string>, tank: Tank): Livestock {
  const type = tankAquariumType(tank);
  const selected = availableSpecies(type).find(item => item.name === data.name);
  return {
    name: data.name || "생물 이름 없음",
    type: selected?.type || "생물",
    habitat: selected?.habitat || type,
    image: selected?.image || data.image || "",
    status: data.status || "상태 미입력",
    added: data.added || "",
    memo: data.memo || ""
  };
}

/** app.js:769-774 — 수정 시 도감 항목 역추적 */
function speciesNameForLivestock(item: Livestock, tank: Tank): string {
  const type = tankAquariumType(tank);
  const exact = availableSpecies(type).find(entry => entry.name === item.name);
  if (exact) return exact.name;
  const asset = livestockImage(item, 0, type);
  return availableSpecies(type).find(entry => entry.image === asset)?.name || "";
}

interface LivestockFormProps {
  tank: Tank;
  editingIndex: number | null;
  resetToken: number;
  onSubmit: (index: number | null, item: Livestock) => void;
}

export function LivestockForm({ tank, editingIndex, resetToken, onSubmit }: LivestockFormProps) {
  const isEditing = editingIndex !== null;
  const editingItem = isEditing ? tank.livestock[editingIndex] : null;
  const today = todayIso();
  const [speciesName, setSpeciesName] = useState("");

  // 수정 진입/탱크 전환 시 폼 값 동기화 (fillLivestockForm 대응)
  useEffect(() => {
    setSpeciesName(editingItem ? speciesNameForLivestock(editingItem, tank) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex, tank.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = cleanFormData(form);
    onSubmit(editingIndex, livestockFromFormData(data, tank));
    form.reset();
    setSpeciesName("");
  }

  return (
    <form className="form-grid" id="livestockForm" onSubmit={handleSubmit} key={`${tank.id}-${editingIndex ?? "new"}-${resetToken}`}>
      <SpeciesSelect aquariumType={tankAquariumType(tank)} value={speciesName} onChange={setSpeciesName} />
      <label>
        투입일
        <input type="date" name="added" defaultValue={editingItem?.added || today} />
      </label>
      <label>
        상태
        <select name="status" defaultValue={editingItem?.status || "건강"}>
          <option>건강</option>
          <option>관찰</option>
          <option>격리</option>
        </select>
      </label>
      <label className="wide">
        메모
        <input name="memo" placeholder="먹이 반응, 성격, 위치 등" defaultValue={editingItem?.memo || ""} />
      </label>
      <button className="primary-button wide" id="livestockSubmitLabel" type="submit">
        저장
      </button>
    </form>
  );
}

interface EquipmentFormProps {
  tank: Tank;
  editingIndex: number | null;
  resetToken: number;
  onSubmit: (index: number | null, item: Equipment) => void;
}

export function EquipmentForm({ tank, editingIndex, resetToken, onSubmit }: EquipmentFormProps) {
  const isEditing = editingIndex !== null;
  const editingItem = isEditing ? tank.equipment[editingIndex] : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = cleanFormData(form);
    onSubmit(editingIndex, {
      name: data.name || "장비명 없음",
      status: data.status || "상태 미입력",
      cycle: data.cycle || ""
    });
    form.reset();
  }

  return (
    <form className="form-grid equipment-form" id="equipmentForm" onSubmit={handleSubmit} key={`${tank.id}-${editingIndex ?? "new"}-${resetToken}`}>
      <label>
        장비명
        <input name="name" placeholder="예: 조명" defaultValue={editingItem?.name || ""} />
      </label>
      <label>
        상태
        <input name="status" placeholder="예: 정상" defaultValue={editingItem?.status || ""} />
      </label>
      <label className="wide">
        관리 주기
        <input name="cycle" placeholder="예: 10:00-20:00, 주 2회" defaultValue={editingItem?.cycle || ""} />
      </label>
      <button className="primary-button wide" id="equipmentSubmitLabel" type="submit">
        저장
      </button>
    </form>
  );
}
