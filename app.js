const storageKey = "reef-log-demo-v1";
const notificationStorageKey = "reef-log-notifications-v1";
const todayIso = new Date().toISOString().slice(0, 10);
const defaultNotificationSettings = {
  enabled: false,
  time: "09:00",
  leadDays: 1
};

const species = [
  { name: "퍼큘라 클라운", type: "물고기", level: "초급", nature: "온순", note: "말미잘 없이도 적응이 빠르고 먹이 반응이 좋음", image: "assets/livestock/clownfish.png" },
  { name: "블루탱", type: "물고기", level: "중급", nature: "활동적", note: "넓은 수조와 안정적인 수질이 중요", image: "assets/livestock/blue-tang.png" },
  { name: "옐로우탱", type: "물고기", level: "중급", nature: "영역성", note: "비슷한 체형의 탱류와 합사 시 주의", image: "assets/livestock/yellow-tang.png" },
  { name: "식스라인 래스", type: "물고기", level: "중급", nature: "재빠름", note: "작은 해충 제어에 도움, 소형어 괴롭힘 주의", image: "assets/livestock/firefish-goby.png" },
  { name: "버블 코랄", type: "산호", level: "중급", nature: "야간 촉수", note: "주변 산호와 간격 필요", image: "assets/livestock/bubble-coral.png" },
  { name: "클리너 쉬림프", type: "무척추", level: "초급", nature: "온순", note: "물고기 청소 행동을 보이며 구리 약품에 취약", image: "assets/livestock/cleaner-shrimp.png" },
  { name: "로열 그라마", type: "물고기", level: "초급", nature: "은신 선호", note: "보라색과 노란색 대비가 예쁜 소형어", image: "assets/livestock/royal-gramma.png" },
  { name: "파이어피시 고비", type: "물고기", level: "초급", nature: "겁이 많음", note: "점프 방지 뚜껑과 조용한 합사 환경 권장", image: "assets/livestock/firefish-goby.png" },
  { name: "만다린 드래고넷", type: "물고기", level: "상급", nature: "평화로움", note: "먹이 적응과 충분한 미소생물이 중요", image: "assets/livestock/mandarin-dragonet.png" },
  { name: "플레임 엔젤", type: "물고기", level: "중급", nature: "활동적", note: "산호를 건드릴 수 있어 리프 수조에서는 관찰 필요", image: "assets/livestock/flame-angelfish.png" },
  { name: "버블팁 말미잘", type: "산호", level: "중급", nature: "공생", note: "클라운피시가 머물 수 있으며 강한 조명과 안정적인 수질이 필요", image: "assets/livestock/anemone.png" },
  { name: "토치 코랄", type: "산호", level: "중급", nature: "스위퍼 촉수", note: "흐름이 있는 곳에 두고 주변 산호와 거리를 확보", image: "assets/livestock/torch-coral.png" },
  { name: "그린 스타폴립", type: "산호", level: "초급", nature: "빠른 성장", note: "폴립이 잘 열리며 번식력이 좋아 위치 관리가 중요", image: "assets/livestock/green-star-polyp.png" }
];

const livestockAssetMap = [
  { test: /니모|클라운|퍼큘라|clown/i, src: "assets/livestock/clownfish.png" },
  { test: /옐로우|yellow/i, src: "assets/livestock/yellow-tang.png" },
  { test: /쉬림프|shrimp/i, src: "assets/livestock/cleaner-shrimp.png" },
  { test: /로열|그라마|gramma/i, src: "assets/livestock/royal-gramma.png" },
  { test: /파이어|firefish|고비|goby|래스|wrasse/i, src: "assets/livestock/firefish-goby.png" },
  { test: /만다린|mandarin|드래고넷/i, src: "assets/livestock/mandarin-dragonet.png" },
  { test: /플레임|엔젤|flame|angel/i, src: "assets/livestock/flame-angelfish.png" },
  { test: /블루|blue/i, src: "assets/livestock/blue-tang.png" },
  { test: /말미잘|anemone|버블팁/i, src: "assets/livestock/anemone.png" },
  { test: /버블\s?코랄|bubble/i, src: "assets/livestock/bubble-coral.png" },
  { test: /토치|torch/i, src: "assets/livestock/torch-coral.png" },
  { test: /스타폴립|스타\s?폴립|green star|polyp/i, src: "assets/livestock/green-star-polyp.png" },
  { test: /산호|coral/i, src: "assets/livestock/bubble-coral.png" }
];

const seedData = {
  tankStart: "2026-05-20",
  waterLogs: [
    { date: "2026-06-01", temp: 25.4, salinity: 34.500, ph: 8.1, kh: 8.0, no3: 8.0, nh3: 0.0, po4: 0.05 },
    { date: "2026-06-06", temp: 25.7, salinity: 35.000, ph: 8.2, kh: 8.3, no3: 6.0, nh3: 0.0, po4: 0.04 },
    { date: "2026-06-12", temp: 25.6, salinity: 34.800, ph: 8.1, kh: 8.1, no3: 5.0, nh3: 0.0, po4: 0.03 }
  ],
  tasks: [
    { title: "20% 환수", category: "환수", due: "2026-06-18", memo: "염도 35ppt 맞추기" },
    { title: "스키머 컵 청소", category: "장비", due: todayIso, memo: "목 부분까지 세척" },
    { title: "냉동 브라인 급여", category: "먹이", due: todayIso, memo: "소량만" }
  ],
  livestock: [
    { name: "니모 1호", type: "물고기", added: "2026-05-25", status: "건강", memo: "먹이 반응 좋음" },
    { name: "블루탱", type: "물고기", added: "2026-06-02", status: "관찰", memo: "백점 여부 확인" },
    { name: "그린 스타폴립", type: "산호", added: "2026-06-05", status: "건강", memo: "폴립 잘 열림" }
  ],
  equipment: [
    { name: "조명", status: "정상", cycle: "10:00-20:00" },
    { name: "스키머", status: "청소 필요", cycle: "주 2회" },
    { name: "히터", status: "정상", cycle: "25.5°C" },
    { name: "리턴펌프", status: "정상", cycle: "상시" }
  ]
};

let state = loadState();
let selectedLivestockIndex = null;
let notificationSettings = loadNotificationSettings();
let notificationTimer = null;
let serviceWorkerRegistration = null;

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(seedData);
  try { return JSON.parse(saved); } catch { return structuredClone(seedData); }
}

function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function loadNotificationSettings() {
  const saved = localStorage.getItem(notificationStorageKey);
  if (!saved) return { ...defaultNotificationSettings };
  try { return { ...defaultNotificationSettings, ...JSON.parse(saved) }; } catch { return { ...defaultNotificationSettings }; }
}

function saveNotificationSettings() {
  localStorage.setItem(notificationStorageKey, JSON.stringify(notificationSettings));
}
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const daysBetween = (a, b) => Math.ceil((new Date(a) - new Date(b)) / 86400000);
const sortedLogs = () => [...state.waterLogs].sort((a, b) => a.date.localeCompare(b.date));
const latestLog = () => sortedLogs().at(-1) || {};

function renderAll() {
  renderDashboard();
  renderWater();
  renderLivestock();
  renderLibrary();
  updateNotificationUi();
  scheduleReminderNotification();
  saveState();
}

function renderDashboard() {
  const latest = latestLog();
  $("#heroTemp").textContent = latest.temp ? `${latest.temp}°C` : "-";
  $("#heroSalinity").textContent = latest.salinity ? `${latest.salinity}ppt` : "-";
  const nextWater = state.tasks.filter(t => t.category === "환수").sort((a,b) => a.due.localeCompare(b.due))[0];
  const dday = nextWater ? daysBetween(nextWater.due, todayIso) : null;
  $("#heroWaterChange").textContent = dday === null ? "-" : dday === 0 ? "오늘" : `D${dday > 0 ? "-" + dday : "+" + Math.abs(dday)}`;
  $("#nextReminder").textContent = nextDueText();
  $("#livestockCount").textContent = state.livestock.length;
  $("#taskCount").textContent = state.tasks.filter(t => daysBetween(t.due, todayIso) <= 7).length;
  $("#tankDays").textContent = `${Math.max(1, daysBetween(todayIso, state.tankStart))}일`;
  const score = stabilityScore(latest);
  $("#stabilityScore").textContent = `${score}점`;
  $("#stabilityText").textContent = score >= 85 ? "아주 안정적" : score >= 70 ? "관찰 권장" : "조정 필요";
  renderTankInhabitants();
  renderTasks("#todayTasks", state.tasks.filter(t => t.due <= todayIso).slice(0, 5));
  drawChart();
}

function renderTankInhabitants() {
  const target = $("#tankInhabitants");
  if (!target) return;
  const fishPositions = [
    { x: "62%", y: "42%", scale: ".96" },
    { x: "73%", y: "55%", scale: ".82" },
    { x: "52%", y: "31%", scale: ".72" },
    { x: "39%", y: "46%", scale: ".88" },
    { x: "83%", y: "36%", scale: ".66" },
    { x: "47%", y: "52%", scale: ".78" },
    { x: "68%", y: "25%", scale: ".62" },
    { x: "58%", y: "38%", scale: ".7" }
  ];
  const reefPositions = [
    { x: "30%", y: "72%", scale: ".84" },
    { x: "66%", y: "71%", scale: ".78" },
    { x: "20%", y: "77%", scale: ".66" },
    { x: "76%", y: "76%", scale: ".68" },
    { x: "48%", y: "75%", scale: ".6" },
    { x: "86%", y: "70%", scale: ".58" }
  ];
  const palettes = [
    ["#ffcf68", "#ff7f73"],
    ["#6ee7ff", "#159fb7"],
    ["#ffe66f", "#f0bd4f"],
    ["#b9a8ff", "#5fc6ff"],
    ["#7ff0d4", "#20bfa0"]
  ];
  target.innerHTML = state.livestock.map((item, index) => {
    const kind = inhabitantKind(item.type);
    const posPool = kind === "fish" ? fishPositions : reefPositions;
    const pos = posPool[index % posPool.length];
    const palette = palettes[index % palettes.length];
    const variant = fishVariant(item.name, index);
    const asset = livestockImage(item, index);
    const delay = `${(index % 5) * -0.7}s`;
    const swim = `${12 + (index % 4) * 3}s`;
    const path = `${38 + (index % 3) * 7}px`;
    const arc = `${index % 3 === 0 ? -18 : index % 3 === 1 ? 14 : -10}px`;
    const bob = `${7 + (index % 3) * 2}px`;
    const swimClass = kind === "fish" ? `swim-${index % 3} ${index % 2 === 1 ? "reverse" : ""}` : "";
    return `<button class="inhabitant ${kind} ${variant} ${swimClass} ${asset ? "has-image" : ""} ${selectedLivestockIndex === index ? "selected" : ""}" data-livestock-index="${index}" type="button" title="${escapeHtml(item.name)}" style="--x:${pos.x};--y:${pos.y};--scale:${pos.scale};--delay:${delay};--swim:${swim};--path:${path};--arc:${arc};--bob:${bob};--fish-a:${palette[0]};--fish-b:${palette[1]};">
      ${asset ? `<img class="inhabitant-image" src="${asset}" alt="${escapeHtml(item.name)}" />` : kind === "fish" ? fishMarkup(variant) : ""}
    </button>`;
  }).join("");
  renderSelectedCreature();
}

function livestockImage(item, index = 0) {
  if (item.image) return item.image;
  const name = item.name || "";
  const match = livestockAssetMap.find(entry => entry.test.test(name));
  if (match) return match.src;
  if (item.type === "무척추") return "assets/livestock/cleaner-shrimp.png";
  if (item.type === "산호") {
    const coralFallbacks = [
      "assets/livestock/anemone.png",
      "assets/livestock/bubble-coral.png",
      "assets/livestock/torch-coral.png",
      "assets/livestock/green-star-polyp.png"
    ];
    return coralFallbacks[index % coralFallbacks.length];
  }
  if (item.type !== "물고기") return "";
  const fallbacks = [
    "assets/livestock/clownfish.png",
    "assets/livestock/yellow-tang.png",
    "assets/livestock/royal-gramma.png",
    "assets/livestock/firefish-goby.png",
    "assets/livestock/mandarin-dragonet.png",
    "assets/livestock/flame-angelfish.png"
  ];
  return fallbacks[index % fallbacks.length];
}

function inhabitantKind(type) {
  if (type === "산호") return "coral";
  if (type === "무척추") return "invert";
  return "fish";
}

function fishVariant(name, index) {
  if (name.includes("블루") || name.toLowerCase().includes("blue")) return "blue";
  if (name.includes("옐로우") || name.toLowerCase().includes("yellow")) return "yellow";
  return index % 3 === 1 ? "blue" : index % 3 === 2 ? "yellow" : "clown";
}

function fishMarkup(variant) {
  const stripes = variant === "clown" ? `<span class="fish-stripe one"></span><span class="fish-stripe two"></span>` : "";
  return `<span class="fish-art"><span class="fish-shadow"></span><span class="fish-tail"></span><span class="fish-body"></span><span class="fish-fin"></span><span class="fish-shine"></span><span class="fish-eye"></span><span class="fish-mouth"></span>${stripes}</span>`;
}

function renderSelectedCreature() {
  const name = $("#selectedCreatureName");
  const meta = $("#selectedCreatureMeta");
  if (!name || !meta) return;
  const item = Number.isInteger(selectedLivestockIndex) ? state.livestock[selectedLivestockIndex] : null;
  if (!item) {
    name.textContent = `${state.livestock.length}마리/개체 표시 중`;
    meta.textContent = "어항 안 생물을 누르면 투입일, 상태, 메모를 확인할 수 있습니다.";
    return;
  }
  name.textContent = item.name;
  meta.textContent = `${item.type} · ${item.status} · ${item.added} 투입${item.memo ? " · " + item.memo : ""}`;
}

function addLivestockFromForm(form) {
  state.livestock.push(Object.fromEntries(new FormData(form)));
  selectedLivestockIndex = state.livestock.length - 1;
  form.reset();
  $$('input[type="date"]').forEach(input => { if (!input.value) input.value = todayIso; });
  renderAll();
}

function stabilityScore(log) {
  if (!log.temp) return 0;
  let score = 100;
  if (log.temp < 24.5 || log.temp > 26.5) score -= 15;
  if (log.salinity < 34 || log.salinity > 36) score -= 15;
  if (log.ph < 8.0 || log.ph > 8.4) score -= 10;
  if (log.kh < 7.5 || log.kh > 9.5) score -= 10;
  if (log.no3 > 15) score -= 15;
  if ((log.nh3 || 0) > 0) score -= 20;
  if (log.po4 > 0.1) score -= 15;
  return Math.max(0, score);
}

function nextDueText() {
  const task = [...state.tasks].sort((a,b) => a.due.localeCompare(b.due))[0];
  if (!task) return "등록된 일정 없음";
  const d = daysBetween(task.due, todayIso);
  return `${task.title} · ${d === 0 ? "오늘" : d > 0 ? `${d}일 후` : `${Math.abs(d)}일 지남`}`;
}

function upcomingTasksForNotification() {
  return [...state.tasks]
    .map(task => ({ ...task, distance: daysBetween(task.due, todayIso) }))
    .filter(task => task.distance >= 0 && task.distance <= Number(notificationSettings.leadDays))
    .sort((a, b) => a.due.localeCompare(b.due));
}

function notificationPermissionLabel() {
  if (!("Notification" in window)) return "이 브라우저는 알림을 지원하지 않습니다.";
  if (Notification.permission === "granted") return "브라우저 알림 권한이 허용되어 있습니다.";
  if (Notification.permission === "denied") return "브라우저에서 알림 권한이 차단되어 있습니다.";
  return "알림을 켜면 브라우저 권한 요청이 표시됩니다.";
}

function updateNotificationUi() {
  const enabledInput = $("#notifyEnabled");
  const timeInput = $("#notifyTime");
  const leadInput = $("#notifyLeadDays");
  const status = $("#notificationStatus");
  const summary = $("#notificationSummary");

  if (enabledInput) enabledInput.checked = Boolean(notificationSettings.enabled);
  if (timeInput) timeInput.value = notificationSettings.time;
  if (leadInput) leadInput.value = String(notificationSettings.leadDays);
  if (status) {
    const stateText = notificationSettings.enabled ? "알림 켜짐" : "알림 꺼짐";
    status.textContent = `${stateText} · ${notificationPermissionLabel()}`;
  }
  if (summary) {
    summary.textContent = notificationSettings.enabled
      ? `${notificationSettings.time} · ${notificationSettings.leadDays}일 전 알림`
      : "알림 설정 꺼짐";
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("service-worker.js");
    return serviceWorkerRegistration;
  } catch (error) {
    console.warn("Service worker registration failed", error);
    return null;
  }
}

async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  updateNotificationUi();
  return permission === "granted";
}

function buildNotificationPayload(isTest = false) {
  if (isTest) {
    return {
      title: "리프로그 테스트 알림",
      body: "푸시 알림 설정이 정상적으로 연결되었습니다."
    };
  }
  const tasks = upcomingTasksForNotification();
  if (!tasks.length) {
    return {
      title: "리프로그 관리 알림",
      body: "가까운 관리 일정은 없지만 오늘의 수질 상태를 확인해 보세요."
    };
  }
  const first = tasks[0];
  const when = first.distance === 0 ? "오늘" : `${first.distance}일 후`;
  return {
    title: "리프로그 관리 알림",
    body: `${first.title} 일정이 ${when} 예정되어 있습니다.${tasks.length > 1 ? ` 외 ${tasks.length - 1}건` : ""}`
  };
}

async function showReminderNotification(isTest = false) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) {
    updateNotificationUi();
    return false;
  }
  const payload = buildNotificationPayload(isTest);
  const options = {
    body: payload.body,
    icon: "assets/icons/icon-192.png",
    badge: "assets/icons/icon-192.png",
    tag: isTest ? "reef-log-test" : "reef-log-reminder",
    renotify: true
  };
  const registration = serviceWorkerRegistration || await navigator.serviceWorker?.ready;
  if (registration?.showNotification) {
    await registration.showNotification(payload.title, options);
  } else {
    new Notification(payload.title, options);
  }
  return true;
}

function scheduleReminderNotification() {
  if (notificationTimer) window.clearTimeout(notificationTimer);
  notificationTimer = null;
  if (!notificationSettings.enabled || !("Notification" in window)) return;

  const [hour, minute] = notificationSettings.time.split(":").map(Number);
  const next = new Date();
  next.setHours(hour || 9, minute || 0, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);

  notificationTimer = window.setTimeout(async () => {
    if (notificationSettings.enabled && Notification.permission === "granted") {
      await showReminderNotification();
    }
    scheduleReminderNotification();
  }, Math.min(next.getTime() - Date.now(), 2147483647));
}

function renderTasks(selector, tasks) {
  const target = $(selector);
  target.innerHTML = tasks.length ? tasks.map(t => `<article class="task-item"><strong>${escapeHtml(t.title)}</strong><small>${t.category} · ${t.due} · ${escapeHtml(t.memo || "메모 없음")}</small></article>`).join("") : `<article class="task-item"><strong>밀린 작업 없음</strong><small>어항이 편안한 하루입니다.</small></article>`;
}

function renderWater() {
  renderTasks("#taskTimeline", [...state.tasks].sort((a,b) => a.due.localeCompare(b.due)));
  $("#waterRows").innerHTML = sortedLogs().reverse().map(log => `<tr><td>${log.date}</td><td>${formatNumber(log.temp, 1)}</td><td>${formatNumber(log.salinity, 3)}</td><td>${formatNumber(log.ph, 1)}</td><td>${formatNumber(log.kh, 1)}</td><td>${formatNumber(log.no3, 1)}</td><td>${formatNumber(log.nh3 || 0, 1)}</td><td>${formatNumber(log.po4, 2)}</td></tr>`).join("");
}

function renderLivestock() {
  $("#livestockGrid").innerHTML = state.livestock.map((item, index) => {
    const asset = livestockImage(item, index);
    return `<article class="creature-card">${asset ? `<img class="creature-image" src="${asset}" alt="${escapeHtml(item.name)}" />` : ""}<span class="badge">${item.type}</span><h2>${escapeHtml(item.name)}</h2><p>${item.added} 투입 · ${item.status}</p><small>${escapeHtml(item.memo || "메모 없음")}</small></article>`;
  }).join("");
  $("#equipmentGrid").innerHTML = state.equipment.map(e => `<article class="equipment-item"><strong>${e.name}</strong><small>${e.status} · ${e.cycle}</small></article>`).join("");
}

function renderLibrary() {
  const q = ($("#librarySearch")?.value || "").trim().toLowerCase();
  const list = species.filter(s => [s.name, s.type, s.level, s.nature, s.note].join(" ").toLowerCase().includes(q));
  $("#libraryList").innerHTML = list.map(s => `<article class="library-item">${s.image ? `<img class="library-image" src="${s.image}" alt="${escapeHtml(s.name)}" />` : ""}<div><strong>${s.name}</strong><small>${s.type} · ${s.level} · ${s.nature}</small><p>${s.note}</p></div></article>`).join("");
  const options = species.map(s => `<option>${s.name}</option>`).join("");
  if (!$("#compatA").innerHTML) { $("#compatA").innerHTML = options; $("#compatB").innerHTML = options; $("#compatB").selectedIndex = 1; }
}

function drawChart() {
  const canvas = $("#waterChart");
  const ctx = canvas.getContext("2d");
  const logs = sortedLogs().slice(-7);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f7fbfb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d9e7e8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { const y = 30 + i * 48; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(610, y); ctx.stroke(); }
  plot(logs, "salinity", "#1d9bd1", 33, 37, "염도");
  plot(logs, "kh", "#30b99a", 6, 11, "KH");
  plot(logs, "no3", "#ff7d6e", 0, 20, "NO3");
}

function plot(logs, key, color, min, max, label) {
  const canvas = $("#waterChart");
  const ctx = canvas.getContext("2d");
  const xStep = logs.length > 1 ? 540 / (logs.length - 1) : 0;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath();
  logs.forEach((log, i) => {
    const x = 50 + i * xStep;
    const y = 230 - ((log[key] - min) / (max - min)) * 185;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  logs.forEach((log, i) => { const x = 50 + i * xStep; const y = 230 - ((log[key] - min) / (max - min)) * 185; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
  const legendX = { salinity: 430, kh: 500, no3: 555 }[key];
  ctx.fillRect(legendX, 18, 10, 10); ctx.fillStyle = "#19313d"; ctx.font = "13px Segoe UI"; ctx.fillText(label, legendX + 16, 28);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function formatNumber(value, digits) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "-";
}

function setupAquariumCursorIdle() {
  const stage = $(".aquarium-stage");
  if (!stage) return;
  let idleTimer = null;
  const clearIdleTimer = () => {
    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = null;
  };
  const showCursorThenIdle = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    stage.classList.remove("cursor-idle");
    clearIdleTimer();
    idleTimer = window.setTimeout(() => stage.classList.add("cursor-idle"), 450);
  };

  stage.addEventListener("pointerenter", showCursorThenIdle);
  stage.addEventListener("pointermove", showCursorThenIdle);
  stage.addEventListener("mouseenter", showCursorThenIdle);
  stage.addEventListener("mousemove", showCursorThenIdle);
  const resetCursor = () => {
    clearIdleTimer();
    stage.classList.remove("cursor-idle");
  };
  stage.addEventListener("pointerleave", resetCursor);
  stage.addEventListener("mouseleave", resetCursor);
}

$$(".nav-button").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
$$("[data-view-jump]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.viewJump)));
function switchView(id) {
  $$(".nav-button").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  $$(".view").forEach(v => v.classList.toggle("active", v.id === id));
}

$$("[data-open-modal]").forEach(btn => btn.addEventListener("click", () => $("#" + btn.dataset.openModal).showModal()));
$("#waterForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  state.waterLogs.push({ date: data.date, temp:+data.temp, salinity:+data.salinity, ph:+data.ph, kh:+data.kh, no3:+data.no3, nh3:+data.nh3, po4:+data.po4 });
  event.currentTarget.reset(); renderAll();
});
$("#livestockForm").addEventListener("submit", event => {
  event.preventDefault();
  addLivestockFromForm(event.currentTarget);
  switchView("dashboard");
});
$("#quickLivestockForm").addEventListener("submit", event => {
  event.preventDefault();
  addLivestockFromForm(event.currentTarget);
  $("#creatureModal").close();
});
$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  state.tasks.push(Object.fromEntries(new FormData(event.currentTarget)));
  $("#taskModal").close(); event.currentTarget.reset(); renderAll();
});
$("#tankInhabitants").addEventListener("click", event => {
  const button = event.target.closest("[data-livestock-index]");
  if (!button) return;
  selectedLivestockIndex = Number(button.dataset.livestockIndex);
  $$("[data-livestock-index]").forEach(item => {
    item.classList.toggle("selected", item === button);
  });
  renderSelectedCreature();
});
$("#librarySearch").addEventListener("input", renderLibrary);
$("#checkCompat").addEventListener("click", () => {
  const a = $("#compatA").value;
  const b = $("#compatB").value;
  const risky = [a, b].some(name => name.includes("탱")) && a !== b && [a, b].some(name => name.includes("옐로우"));
  $("#compatResult").textContent = a === b ? "같은 생물은 개체 수와 수조 크기를 먼저 확인하세요." : risky ? "주의: 영역성이 강할 수 있어 충분한 수조 크기와 은신처가 필요합니다." : "대체로 가능: 체급 차이, 먹이 경쟁, 공격성만 관찰하세요.";
});
$("#resetDemo").addEventListener("click", () => { state = structuredClone(seedData); selectedLivestockIndex = null; renderAll(); });
$$("[data-notification-settings]").forEach(btn => btn.addEventListener("click", () => {
  updateNotificationUi();
  $("#notificationModal")?.showModal();
}));
$("#notificationForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  notificationSettings = {
    enabled: data.enabled === "on",
    time: data.time || defaultNotificationSettings.time,
    leadDays: Number(data.leadDays ?? defaultNotificationSettings.leadDays)
  };
  if (notificationSettings.enabled) {
    const allowed = await ensureNotificationPermission();
    notificationSettings.enabled = allowed;
  }
  saveNotificationSettings();
  updateNotificationUi();
  scheduleReminderNotification();
  $("#notificationModal")?.close();
});
$("#testNotification")?.addEventListener("click", async () => {
  await showReminderNotification(true);
  updateNotificationUi();
});

$$('input[type="date"]').forEach(input => { if (!input.value) input.value = todayIso; });
registerServiceWorker().then(() => scheduleReminderNotification());
setupAquariumCursorIdle();
renderAll();
