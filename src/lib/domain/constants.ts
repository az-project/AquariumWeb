// app.js:1-119 이식. 이미지 경로 문자열은 state.json 데이터 호환을 위해
// 바닐라와 동일하게 "assets/..." 상대 형태를 유지한다 (앱이 "/" 단일 라우트라 동작 동일).
import type {
  AquariumBackground,
  AquariumTypeConfig,
  AquariumTypeId,
  Species,
  WaterMetric
} from "./types";

export const STORAGE_KEY = "reef-log-empty-v2";
export const LEGACY_STORAGE_KEYS = ["reef-log-demo-v1"];
export const NOTIFICATION_STORAGE_KEY = "reef-log-notifications-v1";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  time: "09:00",
  leadDays: 1
};

export const saltwaterSpecies: Species[] = [
  { name: "퍼큘라 클라운", type: "물고기", level: "초급", nature: "온순", note: "말미잘 없이도 적응이 빠르고 먹이 반응이 좋음", image: "assets/livestock/clownfish.png" },
  { name: "블루탱", type: "물고기", level: "중급", nature: "활동적", note: "넓은 수조와 안정적인 수질이 중요", image: "assets/livestock/blue-tang.png" },
  { name: "옐로우탱", type: "물고기", level: "중급", nature: "영역성", note: "비슷한 체형의 탱류와 합사 시 주의", image: "assets/livestock/yellow-tang.png" },
  { name: "식스라인 래스", type: "물고기", level: "중급", nature: "재빠름", note: "작은 해충 제어에 도움, 소형어 괴롭힘 주의", image: "assets/livestock/sixline-wrasse.png" },
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

export const freshwaterSpecies: Species[] = [
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

export const species: Species[] = [...saltwaterSpecies, ...freshwaterSpecies];

export const aquariumTypes: Record<AquariumTypeId, AquariumTypeConfig> = {
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
    secondaryMetric: "no3"
  }
};

export const aquariumBackgrounds: AquariumBackground[] = [
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

export const waterMetricSets: Record<AquariumTypeId, WaterMetric[]> = {
  saltwater: [
    { key: "temp", label: "수온", unit: "°C", digits: 1, step: "0.1", min: 22, max: 30, idealMin: 24, idealMax: 27, idealOkNote: "안정 범위입니다. 하루 변동폭을 1°C 이내로 유지하세요.", idealLowNote: "히터 설정과 센서 위치를 확인하고 천천히 올리세요.", idealHighNote: "조명 시간, 팬/냉각기, 실내 온도를 확인하세요.", color: "#159fb7" },
    { key: "salinity", label: "염도", unit: "sg", digits: 3, step: "0.001", min: 1.018, max: 1.03, idealMin: 1.023, idealMax: 1.025, idealOkNote: "권장 염도입니다. 보충수는 담수로 천천히 맞추세요.", idealLowNote: "저염 상태입니다. 해수 보충은 천천히 나누어 진행하세요.", idealHighNote: "고염 상태입니다. 담수 보충으로 급변 없이 낮추세요.", color: "#0f7fb8" },
    { key: "kh", label: "알칼리티", unit: "dKH", digits: 1, step: "0.1", min: 5, max: 12, idealMin: 7, idealMax: 9, idealOkNote: "안정 범위입니다. 산호항은 급격한 변동을 피하세요.", idealLowNote: "KH가 낮습니다. 보충제는 소량씩 나누어 올리세요.", idealHighNote: "KH가 높습니다. 보충을 멈추고 자연 하락을 관찰하세요.", color: "#20bfa0" },
    { key: "no3", label: "질산염", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 50, idealMin: 5, idealMax: 10, idealOkNote: "권장 범위입니다. 산호 색과 조류 상태를 함께 보세요.", idealLowNote: "너무 낮습니다. 먹이량/영양염 부족 여부를 확인하세요.", idealHighNote: "높습니다. 먹이량, 여과재, 환수 주기를 점검하세요.", color: "#ff7f73" },
    { key: "no2", label: "아질산염", unit: "ppm", digits: 2, step: "0.01", min: 0, max: 1, idealMin: 0, idealMax: 0, idealOkNote: "검출되지 않는 상태입니다. 여과 사이클이 안정적입니다.", idealLowNote: "검출되지 않는 상태입니다. 여과 사이클이 안정적입니다.", idealHighNote: "독성 신호입니다. 먹이량을 줄이고 환수와 여과 상태를 확인하세요.", color: "#e05888" },
    { key: "nh3", label: "암모니아", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 1, idealMin: 0, idealMax: 0, idealOkNote: "불검출 상태입니다. 현재 생물 안전성이 좋습니다.", idealLowNote: "불검출 상태입니다. 현재 생물 안전성이 좋습니다.", idealHighNote: "위험 신호입니다. 폐사체, 과급여, 여과 문제를 즉시 확인하세요.", color: "#f0bd4f" },
    { key: "po4", label: "인산염", unit: "ppm", digits: 2, step: "0.01", min: 0, max: 0.5, idealMin: 0.05, idealMax: 0.15, idealOkNote: "권장 범위입니다. 질산염과 균형도 함께 확인하세요.", idealLowNote: "너무 낮습니다. 산호 위축이나 색 빠짐을 확인하세요.", idealHighNote: "높습니다. 먹이 찌꺼기, 흡착제, 환수 주기를 점검하세요.", color: "#7c6fe8" }
  ],
  freshwater: [
    { key: "temp", label: "수온", unit: "°C", digits: 1, step: "0.1", min: 18, max: 30, idealMin: 22, idealMax: 28, idealOkNote: "열대어 권장 범위입니다. 급격한 변화만 피하세요.", idealLowNote: "히터 설정, 전원, 물 흐름 위치를 확인하세요.", idealHighNote: "조명 시간과 실내 온도, 냉각 방법을 확인하세요.", color: "#159fb7" },
    { key: "kh", label: "탄산경도(KH)", unit: "dKH", digits: 1, step: "0.1", min: 0, max: 15, idealMin: 2, idealMax: 10, idealOkNote: "pH 완충이 안정적입니다. 급변 없이 유지하세요.", idealLowNote: "완충력이 낮습니다. pH 급변 가능성을 확인하세요.", idealHighNote: "완충력이 높습니다. pH가 잘 내려가지 않을 수 있습니다.", color: "#65b66a" },
    { key: "nh3", label: "암모니아", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 1, idealMin: 0, idealMax: 0, idealOkNote: "불검출 상태입니다. 여과가 안정적으로 보입니다.", idealLowNote: "불검출 상태입니다. 여과가 안정적으로 보입니다.", idealHighNote: "위험 신호입니다. 과급여, 폐사체, 여과 문제를 즉시 확인하세요.", color: "#f0bd4f" },
    { key: "no3", label: "질산염", unit: "ppm", digits: 1, step: "0.1", min: 0, max: 50, idealMin: 0, idealMax: 30, idealOkNote: "관리 범위입니다. 수초항은 성장 상태도 함께 보세요.", idealLowNote: "낮게 유지 중입니다. 수초항은 영양 부족 여부를 확인하세요.", idealHighNote: "높습니다. 환수 주기, 먹이량, 바닥 찌꺼기를 점검하세요.", color: "#ff7f73" },
    { key: "no2", label: "아질산염", unit: "ppm", digits: 2, step: "0.01", min: 0, max: 1, idealMin: 0, idealMax: 0, idealOkNote: "검출되지 않는 상태입니다. 여과 사이클이 안정적입니다.", idealLowNote: "검출되지 않는 상태입니다. 여과 사이클이 안정적입니다.", idealHighNote: "독성 신호입니다. 환수와 여과 박테리아 상태를 확인하세요.", color: "#e05888" },
  ]
};

export const livestockAssetMap: { test: RegExp; src: string }[] = [
  { test: /니모|클라운|퍼큘라|clown/i, src: "assets/livestock/clownfish.png" },
  { test: /옐로우|yellow/i, src: "assets/livestock/yellow-tang.png" },
  { test: /쉬림프|shrimp/i, src: "assets/livestock/cleaner-shrimp-v2.png" },
  { test: /로열|그라마|gramma/i, src: "assets/livestock/royal-gramma.png" },
  { test: /식스|six|래스|wrasse/i, src: "assets/livestock/sixline-wrasse.png" },
  { test: /파이어|firefish|고비|goby/i, src: "assets/livestock/firefish-goby.png" },
  { test: /만다린|mandarin|드래고넷/i, src: "assets/livestock/mandarin-dragonet.png" },
  { test: /플레임|엔젤|flame|angel/i, src: "assets/livestock/flame-angelfish.png" },
  { test: /블루|blue/i, src: "assets/livestock/blue-tang.png" },
  { test: /말미잘|anemone|버블팁/i, src: "assets/livestock/anemone.png" },
  { test: /버블\s?코랄|bubble/i, src: "assets/livestock/bubble-coral.png" },
  { test: /토치|torch/i, src: "assets/livestock/torch-coral.png" },
  { test: /스타폴립|스타\s?폴립|green star|polyp/i, src: "assets/livestock/green-star-polyp.png" },
  { test: /산호|coral/i, src: "assets/livestock/bubble-coral.png" }
];

export interface LivestockMotionSources {
  // Safari는 VP9 WebM의 알파를 합성하지 못하므로 HEVC+알파(.mov, hvc1)를 함께 제공한다.
  webm: string;
  hevc: string;
}

export interface LivestockMotionPair {
  left: LivestockMotionSources;
  right: LivestockMotionSources;
}

// Higgsfield에서 만든 짧은 무음 루프. 새 어종 클립은 이 목록에만 추가하면
// AquariumVisual이 방향별 영상을 자동으로 선택하고, 미등록 어종은 PNG로 폴백한다.
// .mov 생성: ffmpeg -c:v libvpx-vp9 -i in.webm -c:v hevc_videotoolbox -allow_sw 1 \
//   -alpha_quality 0.9 -q:v 60 -vtag hvc1 -movflags +faststart out.mov
export const livestockMotionMap: { test: RegExp; motion: LivestockMotionPair }[] = [
  {
    test: /니모|클라운|퍼큘라|clown/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/clownfish-left.webm",
        hevc: "assets/livestock/motion/clownfish-left.mov"
      },
      right: {
        webm: "assets/livestock/motion/clownfish-right.webm",
        hevc: "assets/livestock/motion/clownfish-right.mov"
      }
    }
  },
  {
    test: /파이어|firefish|고비|goby/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/firefish-goby-cutout.mp4",
        hevc: "assets/livestock/motion/firefish-goby-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/firefish-goby-cutout.mp4",
        hevc: "assets/livestock/motion/firefish-goby-cutout.mp4"
      }
    }
  },
  {
    test: /로열|그라마|gramma/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/royal-gramma-left.webm",
        hevc: "assets/livestock/motion/royal-gramma-left.mov"
      },
      right: {
        webm: "assets/livestock/motion/royal-gramma-right.webm",
        hevc: "assets/livestock/motion/royal-gramma-right.mov"
      }
    }
  },
  {
    test: /클리너|쉬림프|cleaner|shrimp/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/cleaner-shrimp-cutout.mp4",
        hevc: "assets/livestock/motion/cleaner-shrimp-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/cleaner-shrimp-cutout.mp4",
        hevc: "assets/livestock/motion/cleaner-shrimp-cutout.mp4"
      }
    }
  },
  {
    test: /버블\s?코랄|bubble/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/bubble-coral-cutout.mp4",
        hevc: "assets/livestock/motion/bubble-coral-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/bubble-coral-cutout.mp4",
        hevc: "assets/livestock/motion/bubble-coral-cutout.mp4"
      }
    }
  },
  {
    test: /\uD1A0\uCE58|torch/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/torch-coral-cutout.mp4",
        hevc: "assets/livestock/motion/torch-coral-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/torch-coral-cutout.mp4",
        hevc: "assets/livestock/motion/torch-coral-cutout.mp4"
      }
    }
  },
  {
    test: /말미잘|anemone|버블팁/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/anemone-cutout.mp4",
        hevc: "assets/livestock/motion/anemone-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/anemone-cutout.mp4",
        hevc: "assets/livestock/motion/anemone-cutout.mp4"
      }
    }
  },
  {
    test: /블루\s?탱|blue\s?tang|blue/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/blue-tang-cutout.mp4",
        hevc: "assets/livestock/motion/blue-tang-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/blue-tang-cutout.mp4",
        hevc: "assets/livestock/motion/blue-tang-cutout.mp4"
      }
    }
  },
  {
    test: /식스|six|래스|wrasse/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/sixline-wrasse-cutout.mp4",
        hevc: "assets/livestock/motion/sixline-wrasse-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/sixline-wrasse-cutout.mp4",
        hevc: "assets/livestock/motion/sixline-wrasse-cutout.mp4"
      }
    }
  },
  {
    test: /옐로우\s?탱|yellow\s?tang|yellow/i,
    motion: {
      left: {
        webm: "assets/livestock/motion/yellow-tang-cutout.mp4",
        hevc: "assets/livestock/motion/yellow-tang-cutout.mp4"
      },
      right: {
        webm: "assets/livestock/motion/yellow-tang-cutout.mp4",
        hevc: "assets/livestock/motion/yellow-tang-cutout.mp4"
      }
    }
  }
];

export const tankDataKeys = [
  "name",
  "aquariumType",
  "tankStart",
  "aquariumBackground",
  "waterLogs",
  "tasks",
  "livestock",
  "equipment"
] as const;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
