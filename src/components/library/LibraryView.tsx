"use client";

// index.html:265-293 + app.js:1055-1063, 1576-1585 이식 — 도감/합사 뷰
import { useEffect, useMemo, useState } from "react";
import { availableSpecies, levelClass, tankAquariumType } from "@/lib/domain/derive";
import type { Tank } from "@/lib/domain/types";

interface LibraryViewProps {
  tank: Tank;
  active: boolean;
}

export function LibraryView({ tank, active }: LibraryViewProps) {
  const type = tankAquariumType(tank);
  const options = useMemo(() => availableSpecies(type), [type]);

  const [query, setQuery] = useState("");
  const [compatA, setCompatA] = useState("");
  const [compatB, setCompatB] = useState("");
  const [compatResult, setCompatResult] = useState("두 생물을 선택하면 합사 의견을 보여줍니다.");

  // 탱크 타입 전환 시 셀렉트 초기화 (app.js:1059-1062)
  useEffect(() => {
    setCompatA(options[0]?.name || "");
    setCompatB(options[Math.min(1, options.length - 1)]?.name || "");
  }, [options]);

  const list = options.filter(s =>
    [s.name, s.type, s.level, s.nature, s.note].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );

  // app.js:1576-1585
  function checkCompat() {
    if (!compatA || !compatB) {
      setCompatResult("먼저 현재 어항 타입에 맞는 생물을 선택하세요.");
      return;
    }
    const risky = [compatA, compatB].some(name => name.includes("탱")) && compatA !== compatB && [compatA, compatB].some(name => name.includes("옐로우"));
    setCompatResult(
      compatA === compatB
        ? "같은 생물은 개체 수와 수조 크기를 먼저 확인하세요."
        : risky
          ? "주의: 영역성이 강할 수 있어 충분한 수조 크기와 은신처가 필요합니다."
          : "대체로 가능: 체급 차이, 먹이 경쟁, 공격성만 관찰하세요."
    );
  }

  return (
    <section className={`view ${active ? "active" : ""}`} id="library">
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-heading">
            <h2>해수어 도감</h2>
          </div>
          <div className="search-row">
            <input id="librarySearch" placeholder="이름, 난이도, 성격 검색" value={query} onChange={event => setQuery(event.target.value)} />
          </div>
          <div className="level-guide" aria-label="난이도 기준">
            <span>
              <strong className="level-dot beginner">초급</strong> 안정적인 수질에서 적응이 쉬움
            </span>
            <span>
              <strong className="level-dot intermediate">중급</strong> 수조 크기, 합사, 먹이 또는 위치 관리 필요
            </span>
            <span>
              <strong className="level-dot advanced">상급</strong> 장기 안정화, 전용 먹이, 세밀한 관찰 필요
            </span>
          </div>
          <div className="library-list" id="libraryList">
            {list.map(s => (
              <article className="library-item" key={s.name}>
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="library-image" src={s.image} alt={s.name} />
                ) : null}
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    {s.type} · <span className={`level-pill ${levelClass(s.level)}`}>{s.level}</span> · {s.nature}
                  </small>
                  <p>{s.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>합사 체크</h2>
          </div>
          <div className="compat-box">
            <select id="compatA" value={compatA} onChange={event => setCompatA(event.target.value)}>
              {options.map(s => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
            <select id="compatB" value={compatB} onChange={event => setCompatB(event.target.value)}>
              {options.map(s => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
            <button className="primary-button" id="checkCompat" onClick={checkCompat}>
              확인
            </button>
          </div>
          <div className="compat-result" id="compatResult">
            {compatResult}
          </div>
        </section>
      </div>
    </section>
  );
}
