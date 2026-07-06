"use client";

// app.js:809-852 이식 — 종 선택 + 난이도 배지 카드 (livestockForm/quickLivestockForm 공용)
import { useMemo } from "react";
import { availableSpecies, levelClass, levelNote } from "@/lib/domain/derive";
import type { AquariumTypeId } from "@/lib/domain/types";

interface SpeciesSelectProps {
  aquariumType: AquariumTypeId;
  value: string;
  onChange: (name: string) => void;
}

export function SpeciesSelect({ aquariumType, value, onChange }: SpeciesSelectProps) {
  const options = useMemo(() => availableSpecies(aquariumType), [aquariumType]);
  const selected = options.find(item => item.name === value) || null;

  return (
    <>
      <label>
        생물 선택
        <select name="name" data-species-select value={value} onChange={event => onChange(event.target.value)}>
          <option value="">선택 안 함</option>
          {options.map(item => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="species-level-card" data-species-level-card>
        <span className={`level-badge ${selected ? levelClass(selected.level) : ""}`} data-species-level>
          {selected ? selected.level : "선택 안 함"}
        </span>
        <small data-species-level-note>
          {selected ? levelNote(selected.level) : "도감에서 선택하지 않아도 저장할 수 있습니다."}
        </small>
      </div>
    </>
  );
}
