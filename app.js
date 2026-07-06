const storageKey = "reef-log-empty-v2";
const legacyStorageKeys = ["reef-log-demo-v1"];
const notificationStorageKey = "reef-log-notifications-v1";
const todayIso = new Date().toISOString().slice(0, 10);
const defaultNotificationSettings = {
  enabled: false,
  time: "09:00",
  leadDays: 1
};
const assetVersion = "freshwater-species-v1";
const sharedStateEndpoint = "/api/state";
const sessionEndpoint = "/api/session";
const loginEndpoint = "/api/login";
const registerEndpoint = "/api/register";
const logoutEndpoint = "/api/logout";
const memoryStorage = new Map();

const species = [
  { name: "퍼큘라 클라운", type: "물고기", level: "초급", nature: "온순", note: "말미잘 없이도 적응이 빠르고 먹이 반응이 좋음", image: "assets/livestock/clownfish.png" },
  { name: "블루탱", type: "물고기", level: "중급", nature: "활동적", note: "넓은 수조와 안정적인 수질이 중요", image: "assets/livestock/blue-tang.png" },
  { name: "옐로우탱", type: "물고기", level: "중급", nature: "영역성", note: "비슷한 체형의 탱류와 합사 시 주의", image: "assets/livestock/yellow-tang.png" },
  { name: "식스라인 래스", type: "물고기", level: "중급", nature: "재빠름", note: "작은 해충 제어에 도움, 소형어 괴롭힘 주의", image: "assets/livestock/firefish-goby.png" },
  { name: "버블 코랄", type: "산호", level: "중급", nature: "야간 촉수", note: "주변 산호와 간격 필요", image: "assets/livestock/bubble-coral.png" },
  { name: "클리너 쉬림프", type: "무척추", level: "초급", nature: "온순", note: "물고기 청소 행동을 보이며 구리 약품에 취약", image: "assets/livestock/cleaner-shrimp-v2.png" },
  { name: "로열 그라마", type: "물고기", level: "초급", nature: "은신 선호", note: "보라색과 노란색 대비가 예쁜 소형어", image: "assets/livestock/royal-gramma.png" },
  { name: "파이어피시 고비", type: "물고기", level: "초급", nature: "겁이 많음", note: "점프 방지 뚜껑과 조용한 합사 환경 권장", image: "assets/livestock/firefish-goby.png" },
  { name: "만다린 드래고넷", type: "물고기", level: "상급", nature: "평화로움", note: "먹이 적응과 충분한 미소생물이 중요", image: "assets/livestock/mandarin-dragonet.png" },
  { name: "플레임 엔젤", type: "물고기", level: "중급", nature: "활동적", note: "산호를 건드릴 수 있어 리프 수조에서는 관찰 필요", image: "assets/livestock/flame-angelfish.png" },
  { name: "버블팁 말미잘", type: "산호", level: "중급", nature: "공생", note: "클라운피시가 머물 수 있으며 강한 조명과 안정적인 수질이 필요", image: "assets/livestock/anemone.png" },
  { name: "토치 코랄", type: "산호", level: "중급", nature: "스위퍼 촉수", note: "흐름이 있는 곳에 두고 주변 산호와 거리를 확보", image: "assets/livestock/torch-coral.png" },
  { name: "그린 스타폴립", type: "산호", level: "초급", nature: "빠른 성장", note: "폴립이 잘 열리며 번식력이 좋아 위치 관리가 중요", image: "assets/livestock/green-star-polyp.png" }
];

const freshwaterSpecies = [
  { name: "네온 테트라", type: "물고기", level: "초급", nature: "군영", note: "6마리 이상 무리로 키우면 안정적이며 온순한 소형어와 잘 어울림", habitat: "freshwater", image: "assets/livestock/neon-tetra.png" },
  { name: "구피", type: "물고기", level: "초급", nature: "활발", note: "번식이 쉽고 수질 변화에 비교적 강하지만 과밀을 피해야 함", habitat: "freshwater", image: "assets/livestock/guppy.png" },
  { name: "코리도라스", type: "물고기", level: "초급", nature: "저층 활동", note: "바닥재가 부드러우면 수염 손상이 적고 무리 사육이 안정적임", habitat: "freshwater", image: "assets/livestock/corydoras.png" },
  { name: "베타", type: "물고기", level: "초급", nature: "단독 선호", note: "수컷끼리 합사는 피하고 잔잔한 수류와 은신처가 좋음", habitat: "freshwater", image: "assets/livestock/betta.png" },
  { name: "오토싱", type: "물고기", level: "중급", nature: "이끼 섭식", note: "초기 적응과 먹이 보충이 중요하며 공격적인 어종은 피하는 편이 좋음", habitat: "freshwater", image: "assets/livestock/otocinclus.png" },
  { name: "엔젤피시", type: "물고기", level: "중급", nature: "영역성", note: "성장 후 공간이 필요하고 작은 어종과의 합사는 주의가 필요", habitat: "freshwater", image: "assets/livestock/freshwater-angelfish.png" },
  { name: "제브라 다니오", type: "물고기", level: "초급", nature: "활발", note: "수면 근처를 빠르게 헤엄치며 튼튼하지만 점프 방지 뚜껑이 좋음", habitat: "freshwater", image: "assets/livestock/zebra-danio.png" },
  { name: "플래티", type: "물고기", level: "초급", nature: "온순", note: "색상이 다양하고 적응력이 좋아 초보 담수어항에 잘 맞음", habitat: "freshwater", image: "assets/livestock/platy.png" },
  { name: "블랙 몰리", type: "물고기", level: "초급", nature: "활발", note: "수질이 안정적이고 약알칼리성 환경에서 컨디션이 좋음", habitat: "freshwater", image: "assets/livestock/black-molly.png" },
  { name: "드워프 구라미", type: "물고기", level: "중급", nature: "온순", note: "수초가 있는 조용한 어항에서 색이 잘 올라오며 공격적인 합사는 피함", habitat: "freshwater", image: "assets/livestock/dwarf-gourami.png" }
];

species.push(...freshwaterSpecies);

const aquariumTypes = {
  saltwater: {
    label: "해수어항",
    eyebrow: "My Saltwater Aquarium",
    defaultName: "나의 해수어항",
    defaultBackground: "saltwater-open",
    livestockHelp: "물고기/산호/무척추",
    secondaryMetric: "salinity"
  },
  freshwater: {
    label: "담수어항",
    eyebrow: "My Freshwater Aquarium",
    defaultName: "나의 담수어항",
    defaultBackground: "freshwater-rocks",
    livestockHelp: "물고기/수초/무척추",
    secondaryMetric: "ph"
  }
};

const aquariumBackgrounds = [
  { id: "saltwater-open", label: "해수 오픈 리프", type: "해수", src: "assets/backgrounds/saltwater-coral-open-hq.jpg" },
  { id: "saltwater-canyon", label: "해수 코랄 캐년", type: "해수", src: "assets/backgrounds/saltwater-coral-canyon-hq.jpg" },
  { id: "saltwater-cave", label: "해수 리프 케이브", type: "해수", src: "assets/backgrounds/saltwater-coral-cave-hq.jpg" },
  { id: "saltwater-pillars", label: "해수 코랄 타워", type: "해수", src: "assets/backgrounds/saltwater-coral-pillars-hq.jpg" },
  { id: "saltwater-lagoon", label: "해수 라군", type: "해수", src: "assets/backgrounds/saltwater-coral-lagoon-hq.jpg" },
  { id: "saltwater-left-reef", label: "해수 사이드 리프", type: "해수", src: "assets/backgrounds/saltwater-coral-left-reef-hq.jpg" },
  { id: "freshwater-rocks", label: "담수 스톤 가든", type: "담수", src: "assets/backgrounds/freshwater-rocks-hq.jpg" },
  { id: "freshwater-driftwood", label: "담수 유목 아치", type: "담수", src: "assets/backgrounds/freshwater-driftwood-arch-hq.jpg" },
  { id: "freshwater-jungle", label: "담수 정글 패스", type: "담수", src: "assets/backgrounds/freshwater-jungle-path-hq.jpg" },
  { id: "freshwater-stump", label: "담수 스텀프 밸리", type: "담수", src: "assets/backgrounds/freshwater-stump-valley-hq.jpg" },
  { id: "freshwater-center", label: "담수 센터 플랜트", type: "담수", src: "assets/backgrounds/freshwater-center-plants-hq.jpg" },
  { id: "freshwater-lily", label: "담수 릴리 패스", type: "담수", src: "assets/backgrounds/freshwater-lily-path-hq.jpg" }
];

const waterMetricSets = {
  saltwater: [
    { key: "temp", label: "수온", unit: "°C", digits: 1, step: "0.1", min: 22, max: 30, color: "#159fb7" },
    { key: "salinity", label: "염도", unit: "ppt", digits: 3, step: "0.001", min: 32, max: 38, color: "#0f7fb8" },
    { key: "kh", label: "알칼리티", unit: "dKH", digits: 1, step: "0.1", min: 5, max: 12, color: "#20bfa0" },
    { key: "no3", label: "질산염", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 50, color: "#ff7f73" },
    { key: "nh3", label: "암모니아", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 1, color: "#f0bd4f" },
    { key: "po4", label: "인산염", unit: "ppm", digits: 2, step: "0.01", min: 0, max: .5, color: "#7c6fe8" }
  ],
  freshwater: [
    { key: "temp", label: "수온", unit: "°C", digits: 1, step: "0.1", min: 18, max: 30, color: "#159fb7" },
    { key: "ph", label: "산도(pH)", unit: "", digits: 1, step: "0.1", min: 5.5, max: 8.5, color: "#0f7fb8" },
    { key: "gh", label: "총경도(GH)", unit: "dGH", digits: 1, step: "0.1", min: 0, max: 20, color: "#20bfa0" },
    { key: "kh", label: "탄산경도(KH)", unit: "dKH", digits: 1, step: "0.1", min: 0, max: 15, color: "#65b66a" },
    { key: "nh3", label: "암모니아", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 1, color: "#f0bd4f" },
    { key: "no2", label: "아질산염", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 5, color: "#7c6fe8" },
    { key: "no3", label: "질산염", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 50, color: "#ff7f73" }
  ]
};

const livestockAssetMap = [
  { test: /니모|클라운|퍼큘라|clown/i, src: "assets/livestock/clownfish.png" },
  { test: /옐로우|yellow/i, src: "assets/livestock/yellow-tang.png" },
  { test: /쉬림프|shrimp/i, src: "assets/livestock/cleaner-shrimp-v2.png" },
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

const tankDataKeys = ["name", "aquariumType", "tankStart", "aquariumBackground", "waterLogs", "tasks", "livestock", "equipment"];
const seedTank = createTank("saltwater", aquariumTypes.saltwater.defaultName, "tank-saltwater-main");
const seedData = {
  activeTankId: seedTank.id,
  tanks: [seedTank],
  ...tankSnapshot(seedTank)
};

let state = loadState();
let selectedLivestockIndex = null;
let editingWaterLogIndex = null;
let editingLivestockIndex = null;
let editingEquipmentIndex = null;
let tankDragState = null;
let suppressTankClickUntil = 0;
let sharedStateEnabled = false;
let sharedStateSaveTimer = null;
let applyingSharedState = false;
let authMode = "local";
let authView = "login";
let currentUser = null;
let notificationSettings = loadNotificationSettings();
let notificationTimer = null;
let serviceWorkerRegistration = null;
let chartPoints = [];
let chartResizeTimer = null;

function loadState() {
  legacyStorageKeys.forEach(removeStorageItem);
  const saved = getStorageItem(storageKey);
  if (!saved) return cloneData(seedData);
  try { return migrateState(JSON.parse(saved)); } catch { return cloneData(seedData); }
}

function saveState() {
  syncActiveTank();
  setStorageItem(storageKey, JSON.stringify(state));
  if (sharedStateEnabled && !applyingSharedState) queueSharedStateSave();
}
function loadNotificationSettings() {
  const saved = getStorageItem(notificationStorageKey);
  if (!saved) return { ...defaultNotificationSettings };
  try { return { ...defaultNotificationSettings, ...JSON.parse(saved) }; } catch { return { ...defaultNotificationSettings }; }
}

function saveNotificationSettings() {
  setStorageItem(notificationStorageKey, JSON.stringify(notificationSettings));
}
function getStorageItem(key) {
  try { return globalThis.localStorage?.getItem(key) || null; } catch { return memoryStorage.get(key) || null; }
}

function setStorageItem(key, value) {
  try { globalThis.localStorage?.setItem(key, value); } catch { memoryStorage.set(key, value); }
}

function removeStorageItem(key) {
  try { globalThis.localStorage?.removeItem(key); } catch { memoryStorage.delete(key); }
}

function cloneData(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function tankSnapshot(tank) {
  return {
    name: tank.name,
    aquariumType: tank.aquariumType,
    tankStart: tank.tankStart,
    aquariumBackground: tank.aquariumBackground,
    waterLogs: cloneData(tank.waterLogs || []),
    tasks: cloneData(tank.tasks || []),
    livestock: cloneData(tank.livestock || []),
    equipment: cloneData(tank.equipment || [])
  };
}

function createTank(type = "saltwater", name = "", id = "") {
  const aquariumType = aquariumTypes[type] ? type : "saltwater";
  const config = aquariumTypes[aquariumType];
  return {
    id: id || `tank-${aquariumType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: name || config.defaultName,
    aquariumType,
    tankStart: todayIso,
    aquariumBackground: config.defaultBackground,
    waterLogs: [],
    tasks: [],
    livestock: [],
    equipment: []
  };
}

function normalizeTank(tank, fallbackType = "saltwater", fallbackName = "") {
  const type = aquariumTypes[tank?.aquariumType] ? tank.aquariumType : fallbackType;
  const config = aquariumTypes[type] || aquariumTypes.saltwater;
  const id = tank?.id || `tank-${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const background = aquariumBackgrounds.some(item => item.id === tank?.aquariumBackground)
    ? tank.aquariumBackground
    : config.defaultBackground;
  return {
    id,
    name: String(tank?.name || fallbackName || config.defaultName),
    aquariumType: type,
    tankStart: tank?.tankStart || todayIso,
    aquariumBackground: background,
    waterLogs: Array.isArray(tank?.waterLogs) ? tank.waterLogs : [],
    tasks: Array.isArray(tank?.tasks) ? tank.tasks : [],
    livestock: Array.isArray(tank?.livestock) ? tank.livestock.map(normalizeLivestockAsset) : [],
    equipment: Array.isArray(tank?.equipment) ? tank.equipment : []
  };
}

function normalizeLivestockAsset(item) {
  if (item?.image === "assets/livestock/cleaner-shrimp.png") {
    return { ...item, image: "assets/livestock/cleaner-shrimp-v2.png" };
  }
  return item;
}

function hydrateActiveTank() {
  const tank = activeTank();
  if (!tank) return;
  Object.assign(state, tankSnapshot(tank));
}

function syncActiveTank() {
  const tank = activeTank();
  if (!tank) return;
  tankDataKeys.forEach(key => {
    tank[key] = cloneData(state[key]);
  });
}

function activeTank() {
  return state.tanks?.find(tank => tank.id === state.activeTankId) || state.tanks?.[0] || null;
}

function currentAquariumType() {
  return aquariumTypes[state.aquariumType] ? state.aquariumType : "saltwater";
}

function currentAquariumConfig() {
  return aquariumTypes[currentAquariumType()];
}

function currentWaterMetrics() {
  return waterMetricSets[currentAquariumType()] || waterMetricSets.saltwater;
}

function migrateState(data) {
  if (!data) return cloneData(seedData);
  if (isDefaultSampleState(data)) return cloneData(seedData);

  if (Array.isArray(data.tanks) && data.tanks.length) {
    const tanks = data.tanks.map(tank => normalizeTank(tank));
    const activeTankId = tanks.some(tank => tank.id === data.activeTankId) ? data.activeTankId : tanks[0].id;
    const nextState = { ...data, tanks, activeTankId };
    Object.assign(nextState, tankSnapshot(tanks.find(tank => tank.id === activeTankId) || tanks[0]));
    return nextState;
  }

  const legacyTank = normalizeTank({
    id: "tank-saltwater-main",
    name: "나의 해수어항",
    aquariumType: "saltwater",
    tankStart: data.tankStart,
    aquariumBackground: data.aquariumBackground,
    waterLogs: data.waterLogs,
    tasks: data.tasks,
    livestock: data.livestock,
    equipment: data.equipment
  });
  return {
    activeTankId: legacyTank.id,
    tanks: [legacyTank],
    ...tankSnapshot(legacyTank)
  };
}

function isDefaultSampleState(data) {
  if (!data || data.tankStart !== "2026-05-20") return false;
  const hasSampleWater = data.waterLogs?.some(log => log.date === "2026-06-01" && Number(log.temp) === 25.4);
  const hasSampleLivestock = data.livestock?.some(item => item.name === "니모 1호" || item.name === "블루탱");
  const hasSampleEquipment = data.equipment?.some(item => item.name === "조명" || item.name === "스키머");
  return Boolean(hasSampleWater || hasSampleLivestock || hasSampleEquipment);
}

async function initializeSharedState() {
  try {
    const response = await fetch(sharedStateEndpoint, { cache: "no-store" });
    if (response.status === 401) {
      sharedStateEnabled = false;
      setAuthUi(true);
      return;
    }
    if (!response.ok) return;
    const sharedState = await response.json();
    sharedStateEnabled = true;
    if (sharedState && Object.keys(sharedState).length) {
      applyingSharedState = true;
      state = migrateState(sharedState);
      selectedLivestockIndex = null;
      setStorageItem(storageKey, JSON.stringify(state));
      renderAll();
      applyingSharedState = false;
    } else {
      queueSharedStateSave();
    }
  } catch {
    sharedStateEnabled = false;
    applyingSharedState = false;
  }
}

function queueSharedStateSave() {
  if (sharedStateSaveTimer) window.clearTimeout(sharedStateSaveTimer);
  sharedStateSaveTimer = window.setTimeout(saveSharedState, 350);
}

async function saveSharedState() {
  sharedStateSaveTimer = null;
  try {
    const response = await fetch(sharedStateEndpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    if (response.status === 401) {
      sharedStateEnabled = false;
      setAuthUi(true);
      return;
    }
    sharedStateEnabled = response.ok;
  } catch {
    sharedStateEnabled = false;
  }
}
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const daysBetween = (a, b) => Math.ceil((new Date(a) - new Date(b)) / 86400000);
const sortedLogs = () => [...state.waterLogs].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

function setAuthUi(locked) {
  const authScreen = $("#authScreen");
  const logoutButton = $("#logoutButton");
  const disabled = authMode === "file";
  if (authScreen) authScreen.hidden = !locked;
  document.body.classList.toggle("auth-locked", locked);
  if (logoutButton) logoutButton.hidden = authMode !== "server" || locked;
  $$("#loginForm input, #loginForm button").forEach(control => {
    control.disabled = disabled;
  });
}

function setAuthView(mode) {
  authView = mode === "register" ? "register" : "login";
  const isRegister = authView === "register";
  $("#authTitle").textContent = isRegister ? "회원가입" : "로그인";
  $("#authCopy").textContent = isRegister
    ? "새 계정을 만든 뒤 같은 서버의 공유 어항 데이터를 함께 사용할 수 있습니다."
    : "공유 어항 데이터를 보려면 계정으로 접속하세요.";
  $("#authSubmitButton").textContent = isRegister ? "회원가입" : "로그인";
  const passwordInput = $("#loginForm input[name='password']");
  const confirmInput = $("#loginForm input[name='confirmPassword']");
  if (passwordInput) passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
  if (confirmInput) {
    confirmInput.required = isRegister;
    confirmInput.disabled = !isRegister;
    confirmInput.closest("[data-register-only]").hidden = !isRegister;
    if (!isRegister) confirmInput.value = "";
  }
  $$("[data-auth-mode]").forEach(button => {
    button.classList.toggle("active", button.dataset.authMode === authView);
  });
  setAuthMessage("");
}

function setAuthMessage(message = "", type = "hint") {
  const hint = $("#authHint");
  const error = $("#loginError");
  if (hint) hint.textContent = type === "hint" ? message : "";
  if (error) error.textContent = type === "error" ? message : "";
}

function getAuthErrorMessage(status, fallback = "") {
  if (status === 401) return "아이디 또는 비밀번호가 맞지 않습니다.";
  if (status === 429) return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.";
  if (status === 409) return "이미 사용 중인 아이디입니다.";
  if (status === 400) return fallback || "입력값을 다시 확인해 주세요.";
  return fallback || (authView === "register" ? "회원가입에 실패했습니다." : "로그인에 실패했습니다.");
}

async function initializeAuth() {
  if (window.location.protocol === "file:") {
    authMode = "file";
    currentUser = null;
    setAuthMessage("로그인과 공유 저장은 서버 실행이 필요합니다. start-server-4174.ps1 또는 Docker로 실행한 뒤 http://127.0.0.1:4174 로 접속하세요.");
    setAuthUi(true);
    return false;
  }

  try {
    const response = await fetch(sessionEndpoint, { cache: "no-store" });
    if (!response.ok) {
      authMode = "local";
      setAuthMessage("");
      setAuthUi(false);
      return true;
    }

    const session = await response.json();
    authMode = "server";
    currentUser = session.authenticated ? session.username : null;
    setAuthMessage("");
    setAuthUi(!session.authenticated);
    return Boolean(session.authenticated);
  } catch {
    authMode = "local";
    setAuthMessage("");
    setAuthUi(false);
    return true;
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const error = $("#loginError");
  const submitButton = form.querySelector("button[type='submit']");
  const data = Object.fromEntries(new FormData(form));
  setAuthMessage("");
  data.username = String(data.username || "").trim();
  if (authView === "register" && data.password !== data.confirmPassword) {
    if (error) error.textContent = "비밀번호 확인이 일치하지 않습니다.";
    return;
  }
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch(authView === "register" ? registerEndpoint : loginEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getAuthErrorMessage(response.status, result.error));
    }

    currentUser = result.username || data.username;
    authMode = "server";
    setAuthView("login");
    setAuthUi(false);
    await initializeSharedState();
  } catch (loginError) {
    if (error) error.textContent = loginError.message || getAuthErrorMessage(0);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function handleLogout() {
  try {
    await fetch(logoutEndpoint, { method: "POST" });
  } catch {
    // The UI should still return to the login screen if the network drops.
  }
  currentUser = null;
  sharedStateEnabled = false;
  if (sharedStateSaveTimer) {
    window.clearTimeout(sharedStateSaveTimer);
    sharedStateSaveTimer = null;
  }
  setAuthUi(true);
}
const latestLog = () => sortedLogs().at(-1) || {};

function renderAll() {
  renderTankSwitcher();
  renderSpeciesSelects();
  renderDashboard();
  renderWater();
  renderLivestock();
  renderLibrary();
  updateNotificationUi();
  scheduleReminderNotification();
  saveState();
}

function renderTankSwitcher() {
  const select = $("#tankSelect");
  const deleteButton = $("#deleteTank");
  const config = currentAquariumConfig();
  $("#tankTypeEyebrow").textContent = config.eyebrow;
  $("#activeTankTitle").textContent = `${state.name || config.defaultName} 상태`;
  $("#livestockMetricHelp").textContent = config.livestockHelp;
  if (deleteButton) {
    deleteButton.disabled = state.tanks.length <= 1;
    deleteButton.title = state.tanks.length <= 1 ? "어항은 최소 1개가 필요합니다." : "현재 선택한 어항 삭제";
  }
  if (!select) return;
  select.innerHTML = state.tanks.map(tank => {
    const typeLabel = aquariumTypes[tank.aquariumType]?.label || "어항";
    return `<option value="${escapeHtml(tank.id)}">${escapeHtml(tank.name)} · ${typeLabel}</option>`;
  }).join("");
  select.value = state.activeTankId;
}

function switchTank(tankId) {
  if (!state.tanks?.some(tank => tank.id === tankId)) return;
  syncActiveTank();
  state.activeTankId = tankId;
  hydrateActiveTank();
  selectedLivestockIndex = null;
  setWaterEditMode(null);
  setLivestockEditMode(null);
  setEquipmentEditMode(null);
  renderAll();
}

function addTank(type) {
  syncActiveTank();
  const sameTypeCount = state.tanks.filter(tank => tank.aquariumType === type).length + 1;
  const tank = createTank(type, `${aquariumTypes[type].label} ${sameTypeCount}`);
  state.tanks.push(tank);
  state.activeTankId = tank.id;
  hydrateActiveTank();
  selectedLivestockIndex = null;
  setWaterEditMode(null);
  setLivestockEditMode(null);
  setEquipmentEditMode(null);
  renderAll();
}

function deleteActiveTank() {
  if (state.tanks.length <= 1) return;
  const tank = activeTank();
  const name = tank?.name || "현재 어항";
  const ok = window.confirm(`${name}을(를) 삭제할까요? 이 어항의 수질, 일정, 생물, 장비 기록이 함께 삭제됩니다.`);
  if (!ok) return;
  state.tanks = state.tanks.filter(item => item.id !== state.activeTankId);
  state.activeTankId = state.tanks[0].id;
  hydrateActiveTank();
  selectedLivestockIndex = null;
  setWaterEditMode(null);
  setLivestockEditMode(null);
  setEquipmentEditMode(null);
  renderAll();
}

function renderDashboard() {
  const latest = latestLog();
  $("#heroTemp").textContent = formatMetric(latest.temp, 1, "°C");
  const secondary = currentWaterMetrics().find(item => item.key === currentAquariumConfig().secondaryMetric) || currentWaterMetrics()[1];
  $("#heroSecondaryLabel").textContent = secondary.label;
  $("#heroSecondaryUnit").textContent = secondary.unit || secondary.label;
  $("#heroSalinity").textContent = formatMetric(latest[secondary.key], secondary.digits, secondary.unit);
  const nextWater = state.tasks.filter(t => t.category === "환수" && isValidDateString(t.due)).sort((a,b) => a.due.localeCompare(b.due))[0];
  const dday = nextWater ? daysBetween(nextWater.due, todayIso) : null;
  $("#heroWaterChange").textContent = dday === null ? "-" : dday === 0 ? "오늘" : `D${dday > 0 ? "-" + dday : "+" + Math.abs(dday)}`;
  $("#nextReminder").textContent = nextDueText();
  $("#livestockCount").textContent = state.livestock.length;
  $("#taskCount").textContent = state.tasks.filter(t => isValidDateString(t.due) && daysBetween(t.due, todayIso) <= 7).length;
  $("#tankDays").textContent = `${Math.max(1, daysBetween(todayIso, state.tankStart))}일`;
  const score = stabilityScore(latest);
  $("#stabilityScore").textContent = score === null ? "-" : `${score}점`;
  $("#stabilityText").textContent = score === null ? "수질 기록 없음" : score >= 85 ? "아주 안정적" : score >= 70 ? "관찰 권장" : "조정 필요";
  renderBackgroundPicker();
  renderTankInhabitants();
  renderTasks("#todayTasks", state.tasks.filter(t => isValidDateString(t.due) && t.due <= todayIso).slice(0, 5));
  drawChart();
}

function selectedAquariumBackground() {
  const fallbackType = currentAquariumType() === "freshwater" ? "담수" : "해수";
  return aquariumBackgrounds.find(background => background.id === state.aquariumBackground)
    || aquariumBackgrounds.find(background => background.type === fallbackType)
    || aquariumBackgrounds[0];
}

function renderBackgroundPicker() {
  const background = selectedAquariumBackground();
  if (state.aquariumBackground !== background.id) state.aquariumBackground = background.id;
  const image = $("#aquariumBackgroundImage");
  if (image) {
    image.src = versionedAsset(background.src);
    image.alt = `${background.label} 어항 배경`;
  }
  $("#currentBackgroundName").textContent = background.label;
  $("#tankSettingsSubtitle").textContent = `${state.name || currentAquariumConfig().defaultName} · ${currentAquariumConfig().label}`;

  const target = $("#backgroundOptions");
  if (!target) return;
  const typeLabel = currentAquariumType() === "freshwater" ? "담수" : "해수";
  const options = aquariumBackgrounds.filter(item => item.type === typeLabel);
  target.innerHTML = options.map(item => `
    <button class="${item.id === background.id ? "active" : ""}" data-background-id="${item.id}" type="button" title="${item.label}">
      <span class="background-thumb" style="background-image:url('${versionedAsset(item.src)}')"></span>
      <span class="background-label">${item.label}</span>
      <small>${item.type}</small>
    </button>
  `).join("");
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
    const basePos = posPool[index % posPool.length];
    const pos = item.tankPosition ? { ...basePos, ...item.tankPosition } : basePos;
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
      ${asset ? `<img class="inhabitant-image" src="${versionedAsset(asset)}" alt="${escapeHtml(item.name)}" />` : kind === "fish" ? fishMarkup(variant) : ""}
    </button>`;
  }).join("");
  renderSelectedCreature();
}

function livestockImage(item, index = 0) {
  if (item.image) return item.image;
  const name = item.name || "";
  const match = livestockAssetMap.find(entry => entry.test.test(name));
  if (match) return match.src;
  if (currentAquariumType() === "freshwater") return "";
  if (item.type === "무척추") return "assets/livestock/cleaner-shrimp-v2.png";
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

function versionedAsset(src) {
  return src ? `${src}?v=${assetVersion}` : "";
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
  const data = cleanFormData(form);
  const selected = availableSpecies().find(item => item.name === data.name);
  data.name = data.name || "생물 이름 없음";
  data.type = selected?.type || "생물";
  data.habitat = selected?.habitat || currentAquariumType();
  data.image = selected?.image || data.image || "";
  data.status = data.status || "상태 미입력";
  if (Number.isInteger(editingLivestockIndex)) {
    data.tankPosition = state.livestock[editingLivestockIndex]?.tankPosition;
    state.livestock[editingLivestockIndex] = data;
    selectedLivestockIndex = editingLivestockIndex;
  } else {
    state.livestock.push(data);
    selectedLivestockIndex = state.livestock.length - 1;
  }
  form.reset();
  setLivestockEditMode(null);
  renderAll();
}

function fillLivestockForm(item) {
  const form = $("#livestockForm");
  if (!form || !item) return;
  const selectedSpecies = speciesForLivestock(item);
  form.elements.name.value = selectedSpecies?.name || "";
  form.elements.added.value = item.added || "";
  form.elements.status.value = item.status || "건강";
  form.elements.memo.value = item.memo || "";
  syncSpeciesType(form.elements.name);
}

function speciesForLivestock(item) {
  const exact = availableSpecies().find(entry => entry.name === item.name);
  if (exact) return exact;
  const asset = livestockImage(item);
  return availableSpecies().find(entry => entry.image === asset) || null;
}

function setLivestockEditMode(index = null) {
  editingLivestockIndex = index;
  const submit = $("#livestockSubmitLabel");
  const cancel = $("#cancelLivestockEdit");
  if (submit) submit.textContent = Number.isInteger(index) ? "생물 수정" : "생물 저장";
  if (cancel) cancel.hidden = !Number.isInteger(index);
}

function equipmentFromForm(form) {
  const data = cleanFormData(form);
  return {
    name: data.name || "장비명 없음",
    status: data.status || "상태 미입력",
    cycle: data.cycle || ""
  };
}

function fillEquipmentForm(item) {
  const form = $("#equipmentForm");
  if (!form || !item) return;
  form.elements.name.value = item.name || "";
  form.elements.status.value = item.status || "";
  form.elements.cycle.value = item.cycle || "";
}

function setEquipmentEditMode(index = null) {
  editingEquipmentIndex = index;
  const submit = $("#equipmentSubmitLabel");
  const cancel = $("#cancelEquipmentEdit");
  if (submit) submit.textContent = Number.isInteger(index) ? "장비 수정" : "장비 저장";
  if (cancel) cancel.hidden = !Number.isInteger(index);
}

function renderSpeciesSelects() {
  const options = `<option value="">선택 안 함</option>${availableSpecies().map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join("")}`;
  $$("[data-species-select]").forEach(select => {
    if (select.innerHTML !== options) select.innerHTML = options;
    syncSpeciesType(select);
  });
}

function availableSpecies() {
  const habitat = currentAquariumType();
  return species.filter(item => (item.habitat || "saltwater") === habitat);
}

function syncSpeciesType(select) {
  const form = select.closest("form");
  const selected = availableSpecies().find(item => item.name === select.value);
  const badge = form?.querySelector("[data-species-level]");
  const note = form?.querySelector("[data-species-level-note]");
  if (!selected) {
    if (badge) {
      badge.textContent = "선택 안 함";
      badge.className = "level-badge";
    }
    if (note) note.textContent = "도감에서 선택하지 않아도 저장할 수 있습니다.";
    return;
  }
  if (badge) {
    badge.textContent = selected.level;
    badge.className = `level-badge ${levelClass(selected.level)}`;
  }
  if (note) note.textContent = levelNote(selected.level);
}

function levelClass(level) {
  return { "초급": "beginner", "중급": "intermediate", "상급": "advanced" }[level] || "beginner";
}

function levelNote(level) {
  return {
    "초급": "안정적인 수질에서 적응이 쉬운 생물입니다.",
    "중급": "수조 크기, 합사, 먹이 또는 위치 관리가 필요합니다.",
    "상급": "장기 안정화와 전용 관리 경험이 필요합니다."
  }[level] || "난이도 정보를 확인하세요.";
}

function stabilityScore(log) {
  if (!hasNumber(log?.temp)) return null;
  let score = 100;
  if (currentAquariumType() === "freshwater") {
    if (hasNumber(log.temp) && (log.temp < 22 || log.temp > 28)) score -= 15;
    if (hasNumber(log.ph) && (log.ph < 6.2 || log.ph > 7.8)) score -= 15;
    if (hasNumber(log.gh) && (log.gh < 3 || log.gh > 14)) score -= 10;
    if (hasNumber(log.kh) && (log.kh < 2 || log.kh > 10)) score -= 10;
    if (hasNumber(log.no3) && log.no3 > 30) score -= 15;
    if (hasNumber(log.nh3) && log.nh3 > 0) score -= 20;
    if (hasNumber(log.no2) && log.no2 > 0) score -= 20;
  } else {
    if (hasNumber(log.temp) && (log.temp < 24.5 || log.temp > 26.5)) score -= 15;
    if (hasNumber(log.salinity) && (log.salinity < 34 || log.salinity > 36)) score -= 15;
    if (hasNumber(log.kh) && (log.kh < 7.5 || log.kh > 9.5)) score -= 10;
    if (hasNumber(log.no3) && log.no3 > 15) score -= 15;
    if (hasNumber(log.nh3) && log.nh3 > 0) score -= 20;
    if (hasNumber(log.po4) && log.po4 > 0.1) score -= 15;
  }
  return Math.max(0, score);
}

function nextDueText() {
  const task = [...state.tasks].filter(t => isValidDateString(t.due)).sort((a,b) => a.due.localeCompare(b.due))[0];
  if (!task) return "등록된 일정 없음";
  const d = daysBetween(task.due, todayIso);
  return `${task.title || "작업명 없음"} · ${d === 0 ? "오늘" : d > 0 ? `${d}일 후` : `${Math.abs(d)}일 지남`}`;
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
  target.innerHTML = tasks.length ? tasks.map(t => `<article class="task-item"><strong>${escapeHtml(t.title || "작업명 없음")}</strong><small>${escapeHtml(t.category || "분류 없음")} · ${escapeHtml(t.due || "날짜 미정")} · ${escapeHtml(t.memo || "메모 없음")}</small></article>`).join("") : `<article class="task-item"><strong>밀린 작업 없음</strong><small>어항이 편안한 하루입니다.</small></article>`;
}

function renderWater() {
  renderWaterFields();
  renderTasks("#taskTimeline", sortedTasks());
  const metrics = currentWaterMetrics();
  $("#waterTableHead").innerHTML = `<tr><th>날짜</th>${metrics.map(item => `<th>${escapeHtml(item.label)}</th>`).join("")}<th>관리</th></tr>`;
  $("#waterRows").innerHTML = state.waterLogs
    .map((log, index) => ({ ...log, index }))
    .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
    .map(log => `<tr><td>${escapeHtml(log.date || "날짜 미정")}</td>${metrics.map(item => `<td>${formatNumber(log[item.key], item.digits)}</td>`).join("")}<td><div class="row-actions"><button class="text-button compact-button" data-edit-water="${log.index}" type="button">수정</button><button class="text-button compact-button danger" data-delete-water="${log.index}" type="button">삭제</button></div></td></tr>`)
    .join("");
}

function renderWaterFields() {
  const metrics = currentWaterMetrics();
  const enabledKeys = new Set(metrics.map(item => item.key));
  $$("[data-water-field]").forEach(label => {
    const key = label.dataset.waterField;
    const metric = metrics.find(item => item.key === key);
    label.hidden = !enabledKeys.has(key);
    if (!metric) return;
    const input = label.querySelector("input");
    label.firstChild.textContent = `${metric.label}${metric.unit ? ` ${metric.unit}` : ""}`;
    if (input) {
      input.step = metric.step;
      input.disabled = !enabledKeys.has(key);
    }
  });
}

function renderLivestock() {
  $("#livestockGrid").innerHTML = state.livestock.map((item, index) => {
    const asset = livestockImage(item, index);
    return `<article class="creature-card">${asset ? `<img class="creature-image" src="${versionedAsset(asset)}" alt="${escapeHtml(item.name)}" />` : ""}<span class="badge">${escapeHtml(item.type || "생물")}</span><h2>${escapeHtml(item.name || "생물 이름 없음")}</h2><p>${escapeHtml(item.added || "투입일 미정")} 투입 · ${escapeHtml(item.status || "상태 미입력")}</p><small>${escapeHtml(item.memo || "메모 없음")}</small><div class="card-actions"><button class="text-button compact-button" data-edit-livestock="${index}" type="button">수정</button><button class="text-button compact-button danger" data-delete-livestock="${index}" type="button">삭제</button></div></article>`;
  }).join("");
  $("#equipmentGrid").innerHTML = state.equipment.map((e, index) => `
    <article class="equipment-item">
      <strong>${escapeHtml(e.name || "장비명 없음")}</strong>
      <small class="equipment-meta">
        <span>${escapeHtml(e.status || "상태 미입력")}</span>
        <span>${escapeHtml(e.cycle || "관리 주기 미입력")}</span>
      </small>
      <div class="row-actions">
        <button class="text-button compact-button" data-edit-equipment="${index}" type="button">수정</button>
        <button class="text-button compact-button danger" data-delete-equipment="${index}" type="button">삭제</button>
      </div>
    </article>
  `).join("");
}

function renderLibrary() {
  const q = ($("#librarySearch")?.value || "").trim().toLowerCase();
  const list = availableSpecies().filter(s => [s.name, s.type, s.level, s.nature, s.note].join(" ").toLowerCase().includes(q));
  $("#libraryList").innerHTML = list.map(s => `<article class="library-item">${s.image ? `<img class="library-image" src="${versionedAsset(s.image)}" alt="${escapeHtml(s.name)}" />` : ""}<div><strong>${s.name}</strong><small>${s.type} · <span class="level-pill ${levelClass(s.level)}">${s.level}</span> · ${s.nature}</small><p>${s.note}</p></div></article>`).join("");
  const options = availableSpecies().map(s => `<option>${s.name}</option>`).join("");
  $("#compatA").innerHTML = options;
  $("#compatB").innerHTML = options;
  $("#compatB").selectedIndex = Math.min(1, availableSpecies().length - 1);
}

function drawChart() {
  const canvas = $("#waterChart");
  if (!canvas) return;
  const size = resizeChartCanvas(canvas);
  if (!size) return;
  const ctx = canvas.getContext("2d");
  chartPoints = [];
  const series = currentWaterMetrics();
  renderChartLegend(series);
  const logs = sortedLogs().filter(log => series.some(item => hasNumber(log[item.key]))).slice(-14);
  const width = size.width;
  const height = size.height;
  const isCompact = width < 430;
  const plotArea = {
    left: isCompact ? 24 : 54,
    right: width - (isCompact ? 12 : 24),
    top: isCompact ? 28 : 46,
    bottom: height - (isCompact ? 40 : 58)
  };
  const plotWidth = plotArea.right - plotArea.left;
  const plotHeight = plotArea.bottom - plotArea.top;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f7fbfb";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d9e7e8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = plotArea.top + (plotHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(plotArea.left, y);
    ctx.lineTo(plotArea.right, y);
    ctx.stroke();
  }

  if (!logs.length) {
    ctx.fillStyle = "#6c817e";
    ctx.font = `${isCompact ? 14 : 18}px Segoe UI, Malgun Gothic, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("수질 기록을 추가하면 그래프가 표시됩니다.", width / 2, height / 2);
    return;
  }

  series.forEach(item => plotSeries(ctx, logs, item, plotArea));

  ctx.fillStyle = "#8aa09d";
  ctx.font = `${isCompact ? 11 : 13}px Segoe UI, Malgun Gothic, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(logs[0]?.date || "시작", plotArea.left, height - 24);
  ctx.textAlign = "right";
  ctx.fillText(logs[logs.length - 1]?.date || "최근", plotArea.right, height - 24);
}

function resizeChartCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width < 20 || height < 20) return null;

  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const nextWidth = Math.round(width * dpr);
  const nextHeight = Math.round(height * dpr);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

function plotSeries(ctx, logs, item, plotArea) {
  const plotWidth = plotArea.right - plotArea.left;
  const plotHeight = plotArea.bottom - plotArea.top;
  const xStep = logs.length > 1 ? plotWidth / (logs.length - 1) : 0;
  const points = logs
    .map((log, index) => {
      if (!hasNumber(log[item.key])) return null;
      const value = Number(log[item.key]);
      const ratio = Math.min(1, Math.max(0, (value - item.min) / (item.max - item.min)));
      return {
        x: plotArea.left + xStep * index,
        y: plotArea.bottom - ratio * plotHeight,
        value,
        date: log.date || "날짜 미정",
        label: item.label,
        color: item.color,
        formatted: `${formatNumber(value, item.digits)}${item.unit}`
      };
    })
    .filter(Boolean);
  if (!points.length) return;

  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  chartPoints.push(...points);
}

function renderChartLegend(series) {
  const legend = $("#chartLegend");
  if (!legend) return;
  legend.innerHTML = series.map(item => `
    <span class="chart-legend-item">
      <i style="background:${item.color}"></i>
      ${escapeHtml(item.label)}
    </span>
  `).join("");
}

function showChartTooltip(event) {
  const canvas = $("#waterChart");
  const tooltip = $("#chartTooltip");
  if (!canvas || !tooltip || !chartPoints.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let nearest = null;
  let nearestDistance = Infinity;
  const hitRadius = 34;
  const overlapRadius = 18;

  chartPoints.forEach(point => {
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  });

  if (!nearest || nearestDistance > hitRadius) {
    hideChartTooltip();
    return;
  }

  const visiblePoints = chartPoints
    .filter(point => Math.hypot(point.x - nearest.x, point.y - nearest.y) <= overlapRadius)
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
  const anchor = visiblePoints.reduce((sum, point) => ({
    x: sum.x + point.x,
    y: sum.y + point.y
  }), { x: 0, y: 0 });
  anchor.x /= visiblePoints.length;
  anchor.y /= visiblePoints.length;

  const cssX = anchor.x;
  const cssY = anchor.y;
  const tooltipWidth = 220;
  const left = Math.min(Math.max(cssX, tooltipWidth / 2 + 8), rect.width - tooltipWidth / 2 - 8);
  const top = Math.max(cssY, 72);
  tooltip.hidden = false;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.innerHTML = `
    <span class="chart-tooltip-date">${escapeHtml(nearest.date)}</span>
    ${visiblePoints.map(point => `
      <span class="chart-tooltip-row">
        <i style="background:${point.color}"></i>
        <strong>${escapeHtml(point.label)}</strong>
        <span>${escapeHtml(point.formatted)}</span>
      </span>
    `).join("")}
  `;
}

function hideChartTooltip() {
  const tooltip = $("#chartTooltip");
  if (tooltip) tooltip.hidden = true;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function formatNumber(value, digits) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "-";
}

function formatMetric(value, digits, unit) {
  return hasNumber(value) ? `${formatNumber(value, digits)}${unit}` : "-";
}

function hasNumber(value) {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

function optionalNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function cleanFormData(form) {
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value ?? "").trim()]));
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function sortedTasks() {
  return [...state.tasks].sort((a, b) => {
    const aDue = isValidDateString(a.due) ? a.due : "9999-12-31";
    const bDue = isValidDateString(b.due) ? b.due : "9999-12-31";
    return aDue.localeCompare(bDue);
  });
}

function waterLogFromForm(form) {
  const data = cleanFormData(form);
  return {
    date: data.date,
    temp: optionalNumber(data.temp),
    salinity: optionalNumber(data.salinity),
    kh: optionalNumber(data.kh),
    ph: optionalNumber(data.ph),
    gh: optionalNumber(data.gh),
    no3: optionalNumber(data.no3),
    nh3: optionalNumber(data.nh3),
    po4: optionalNumber(data.po4),
    no2: optionalNumber(data.no2)
  };
}

function setWaterEditMode(index = null) {
  editingWaterLogIndex = index;
  const submit = $("#waterSubmitLabel");
  const cancel = $("#cancelWaterEdit");
  if (submit) submit.textContent = Number.isInteger(index) ? "수질 수정" : "수질 저장";
  if (cancel) cancel.hidden = !Number.isInteger(index);
}

function fillWaterForm(log) {
  const form = $("#waterForm");
  if (!form || !log) return;
  form.elements.date.value = log.date || "";
  form.elements.temp.value = formatInputValue(log.temp, 1);
  form.elements.salinity.value = formatInputValue(log.salinity, 3);
  form.elements.kh.value = formatInputValue(log.kh, 1);
  form.elements.ph.value = formatInputValue(log.ph, 1);
  form.elements.gh.value = formatInputValue(log.gh, 1);
  form.elements.no3.value = formatInputValue(log.no3, 1);
  form.elements.nh3.value = formatInputValue(log.nh3, 1);
  form.elements.po4.value = formatInputValue(log.po4, 2);
  form.elements.no2.value = formatInputValue(log.no2, 1);
}

function formatInputValue(value, digits) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "";
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

function setupTankDrag() {
  const stage = $(".aquarium-stage");
  const layer = $("#tankInhabitants");
  if (!stage || !layer) return;

  layer.addEventListener("pointerdown", event => {
    const button = event.target.closest("[data-livestock-index]");
    if (!button || event.button !== 0) return;
    const rect = stage.getBoundingClientRect();
    tankDragState = {
      button,
      index: Number(button.dataset.livestockIndex),
      rect,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    button.setPointerCapture?.(event.pointerId);
    button.classList.add("dragging");
  });

  layer.addEventListener("pointermove", event => {
    if (!tankDragState) return;
    const dx = event.clientX - tankDragState.startX;
    const dy = event.clientY - tankDragState.startY;
    if (!tankDragState.moved && Math.hypot(dx, dy) < 4) return;
    tankDragState.moved = true;
    const pos = pointerTankPosition(event, tankDragState.rect);
    tankDragState.button.style.setProperty("--x", pos.x);
    tankDragState.button.style.setProperty("--y", pos.y);
    event.preventDefault();
  });

  const finishDrag = event => {
    if (!tankDragState) return;
    const { button, index, moved, rect } = tankDragState;
    button.releasePointerCapture?.(event.pointerId);
    button.classList.remove("dragging");
    if (moved && state.livestock[index]) {
      const pos = pointerTankPosition(event, rect);
      state.livestock[index].tankPosition = pos;
      button.style.setProperty("--x", pos.x);
      button.style.setProperty("--y", pos.y);
      suppressTankClickUntil = Date.now() + 350;
      saveState();
    }
    tankDragState = null;
  };

  layer.addEventListener("pointerup", finishDrag);
  layer.addEventListener("pointercancel", finishDrag);
}

function pointerTankPosition(event, rect) {
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 7, 93);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 12, 88);
  return { x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

$$(".nav-button").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
$$("[data-view-jump]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.viewJump)));
$("#tankSelect")?.addEventListener("change", event => switchTank(event.target.value));
$("#addSaltwaterTank")?.addEventListener("click", () => addTank("saltwater"));
$("#addFreshwaterTank")?.addEventListener("click", () => addTank("freshwater"));
$("#deleteTank")?.addEventListener("click", deleteActiveTank);
function switchView(id) {
  $$(".nav-button").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  $$(".view").forEach(v => v.classList.toggle("active", v.id === id));
  if (id === "dashboard") requestAnimationFrame(drawChart);
}

$$("[data-open-modal]").forEach(btn => btn.addEventListener("click", () => $("#" + btn.dataset.openModal).showModal()));
$$("[data-close-dialog]").forEach(btn => btn.addEventListener("click", () => btn.closest("dialog")?.close()));
$$("[data-species-select]").forEach(select => select.addEventListener("change", () => syncSpeciesType(select)));
$("#waterChart")?.addEventListener("mousemove", showChartTooltip);
$("#waterChart")?.addEventListener("mouseleave", hideChartTooltip);
window.addEventListener("resize", () => {
  window.clearTimeout(chartResizeTimer);
  chartResizeTimer = window.setTimeout(() => {
    hideChartTooltip();
    drawChart();
  }, 120);
});
$("#waterForm").addEventListener("submit", event => {
  event.preventDefault();
  const waterLog = waterLogFromForm(event.currentTarget);
  if (Number.isInteger(editingWaterLogIndex)) {
    state.waterLogs[editingWaterLogIndex] = waterLog;
  } else {
    state.waterLogs.push(waterLog);
  }
  event.currentTarget.reset();
  setWaterEditMode(null);
  renderAll();
});
$("#cancelWaterEdit").addEventListener("click", () => {
  $("#waterForm").reset();
  setWaterEditMode(null);
});
$("#waterRows").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-water]");
  const deleteButton = event.target.closest("[data-delete-water]");
  if (editButton) {
    const index = Number(editButton.dataset.editWater);
    fillWaterForm(state.waterLogs[index]);
    setWaterEditMode(index);
    $("#waterForm").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (deleteButton) {
    const index = Number(deleteButton.dataset.deleteWater);
    const log = state.waterLogs[index];
    if (!log || !window.confirm(`${log.date} 수질 로그를 삭제할까요?`)) return;
    state.waterLogs.splice(index, 1);
    setWaterEditMode(null);
    renderAll();
  }
});
$("#livestockForm").addEventListener("submit", event => {
  event.preventDefault();
  const wasEditing = Number.isInteger(editingLivestockIndex);
  addLivestockFromForm(event.currentTarget);
  if (!wasEditing) switchView("dashboard");
});
$("#cancelLivestockEdit").addEventListener("click", () => {
  $("#livestockForm").reset();
  setLivestockEditMode(null);
  renderSpeciesSelects();
});
$("#livestockGrid").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-livestock]");
  const deleteButton = event.target.closest("[data-delete-livestock]");
  if (editButton) {
    const index = Number(editButton.dataset.editLivestock);
    fillLivestockForm(state.livestock[index]);
    setLivestockEditMode(index);
    switchView("livestock");
    $("#livestockForm").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (deleteButton) {
    const index = Number(deleteButton.dataset.deleteLivestock);
    const item = state.livestock[index];
    if (!item || !window.confirm(`${item.name} 생물을 삭제할까요?`)) return;
    state.livestock.splice(index, 1);
    if (selectedLivestockIndex === index) selectedLivestockIndex = null;
    if (selectedLivestockIndex > index) selectedLivestockIndex -= 1;
    setLivestockEditMode(null);
    renderAll();
  }
});
$("#equipmentForm").addEventListener("submit", event => {
  event.preventDefault();
  const equipment = equipmentFromForm(event.currentTarget);
  if (Number.isInteger(editingEquipmentIndex)) {
    state.equipment[editingEquipmentIndex] = equipment;
  } else {
    state.equipment.push(equipment);
  }
  event.currentTarget.reset();
  setEquipmentEditMode(null);
  renderAll();
});
$("#cancelEquipmentEdit").addEventListener("click", () => {
  $("#equipmentForm").reset();
  setEquipmentEditMode(null);
});
$("#equipmentGrid").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit-equipment]");
  const deleteButton = event.target.closest("[data-delete-equipment]");
  if (editButton) {
    const index = Number(editButton.dataset.editEquipment);
    fillEquipmentForm(state.equipment[index]);
    setEquipmentEditMode(index);
    $("#equipmentForm").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (deleteButton) {
    const index = Number(deleteButton.dataset.deleteEquipment);
    const item = state.equipment[index];
    if (!item || !window.confirm(`${item.name} 장비를 삭제할까요?`)) return;
    state.equipment.splice(index, 1);
    setEquipmentEditMode(null);
    renderAll();
  }
});
$("#quickLivestockForm").addEventListener("submit", event => {
  event.preventDefault();
  addLivestockFromForm(event.currentTarget);
  $("#creatureModal").close();
});
$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = cleanFormData(event.currentTarget);
  state.tasks.push({
    title: data.title || "작업명 없음",
    category: data.category || "분류 없음",
    due: data.due || "",
    memo: data.memo || ""
  });
  $("#taskModal").close(); event.currentTarget.reset(); renderAll();
});
$("#tankInhabitants").addEventListener("click", event => {
  if (Date.now() < suppressTankClickUntil) return;
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
  if (!a || !b) {
    $("#compatResult").textContent = "먼저 현재 어항 타입에 맞는 생물을 선택하세요.";
    return;
  }
  const risky = [a, b].some(name => name.includes("탱")) && a !== b && [a, b].some(name => name.includes("옐로우"));
  $("#compatResult").textContent = a === b ? "같은 생물은 개체 수와 수조 크기를 먼저 확인하세요." : risky ? "주의: 영역성이 강할 수 있어 충분한 수조 크기와 은신처가 필요합니다." : "대체로 가능: 체급 차이, 먹이 경쟁, 공격성만 관찰하세요.";
});
$("#backgroundOptions")?.addEventListener("click", event => {
  const button = event.target.closest("[data-background-id]");
  if (!button) return;
  state.aquariumBackground = button.dataset.backgroundId;
  renderBackgroundPicker();
  saveState();
});
$("#resetDemo")?.addEventListener("click", () => { state = cloneData(seedData); selectedLivestockIndex = null; setWaterEditMode(null); renderAll(); });
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
$("[data-auth-mode='login']")?.addEventListener("click", () => setAuthView("login"));
$("[data-auth-mode='register']")?.addEventListener("click", () => setAuthView("register"));
setAuthView("login");
$("#loginForm")?.addEventListener("submit", handleAuthSubmit);
$("#logoutButton")?.addEventListener("click", handleLogout);

registerServiceWorker().then(() => scheduleReminderNotification());
setupAquariumCursorIdle();
setupTankDrag();
renderAll();
initializeAuth().then(canLoadSharedState => {
  if (canLoadSharedState) initializeSharedState();
});
