export type SceneTemplateId = "briefing" | "field" | "archive" | "ordering" | "scan" | "ending" | "dreamy" | "playful" | "warm" | "epic" | "portal" | "none";
export type GameTheme = "mystery" | "horror" | "fantasy" | "adventure" | "romance";
export type GameTone =
  | "documentary"
  | "tense"
  | "dreamy"
  | "playful"
  | "noir"
  | "eerie"
  | "warm"
  | "epic";
export type GameColors = {
  primary: string;
  secondary: string;
  special: string;
  text: string;
  background: string;
  forbidden: string;
};

export type ChapterEvidence = {
  id: string;
  name: string;
  imageUrl: string;
};

export type ScenePresentation = {
  content?: string;
  topLine?: string;
  actionLabel?: string;
};

export type SceneContentFormat = "text" | "card" | "droplink" | "modal";
export type SceneEndingMode = "none" | "submission" | "messenger";

export type SceneContent = {
  id?: string;
  format: SceneContentFormat;
  label?: string;
  title?: string;
  body?: string;
  sender?: string;
  notification?: string;
  messages?: string[];
  actionLabel?: string;
  imageUrl?: string;
  imageName?: string;
  modalType?: "progress" | "npc";
  modalProgress?: number;
  npcImage?: string;
  npcImageName?: string;
  npcPresentation?: "face" | "radio" | "record";
  npcTextSpeed?: "normal" | "fast" | "instant";
  messengerImage?: string;
  messengerImageName?: string;
};

export type GameMechanicId =
  | "none"
  | "gps-arrival"
  | "direction-tracking"
  | "image-scan"
  | "ar-treasure"
  | "card-ordering"
  | "text-answer";

export type GameMechanicCategory = "gps" | "ar" | "quiz";

export type MechanicConfigField = {
  key: string;
  label: string;
  description: string;
  input: "text" | "number" | "select";
  defaultValue?: string;
  suffix?: string;
  options?: Array<{ value: string; label: string }>;
};

export type GameMechanic = {
  id: GameMechanicId;
  category: GameMechanicCategory;
  label: string;
  description: string;
  capability: string;
  estimatedMinutes: number;
  configFields: MechanicConfigField[];
};

export const gameMechanicCategories: Array<{ id: GameMechanicCategory; label: string; description: string }> = [
  { id: "quiz", label: "기본", description: "내용 전달과 화면 안에서 푸는 퀴즈를 구성합니다." },
  { id: "gps", label: "GPS", description: "장소·거리·방향을 활용해 이동합니다." },
  { id: "ar", label: "AR", description: "카메라와 현실 공간에서 단서를 찾습니다." },
];

export type MakerScene = {
  id: string;
  chapter?: string;
  chapterName?: string;
  template: SceneTemplateId;
  title: string;
  subtitle?: string;
  body: string;
  content?: SceneContent;
  contentBlocks?: SceneContent[];
  flowOrder?: string[];
  mechanic: string;
  mechanicType?: GameMechanicId;
  mechanicConfig?: Record<string, string>;
  isTitleVisible?: boolean;
  isSubtitleVisible?: boolean;
  presentation?: ScenePresentation;
  endingMode?: SceneEndingMode;
  endingConfig?: Record<string, string>;
  duration: number;
};

export type GameDraft = {
  id: string;
  title: string;
  caseNumber: string;
  summary: string;
  coverAsset: string;
  theme: GameTheme;
  tone: GameTone;
  accent: "lime" | "sky" | "coral" | "violet";
  colors: GameColors;
  estimatedMinutes: number;
  chapterEvidence?: Record<string, ChapterEvidence[]>;
  chapterEvidenceEnabled?: Record<string, boolean>;
  scenes: MakerScene[];
};

export type StarterTemplate = {
  id: string;
  name: string;
  description: string;
  focus: string;
  draft: GameDraft;
};

export const gameThemes: Array<{ id: GameTheme; label: string; description: string }> = [
  { id: "mystery", label: "미스터리", description: "사건과 단서를 추적합니다." },
  { id: "horror", label: "공포", description: "불안과 경계를 쌓아갑니다." },
  { id: "fantasy", label: "판타지", description: "숨은 세계를 발견합니다." },
  { id: "adventure", label: "모험", description: "목적지를 향해 나아갑니다." },
  { id: "romance", label: "로맨스", description: "관계와 선택을 쌓아갑니다." },
];

export const gameTones: Array<{ id: GameTone; label: string; detail: string; accent: GameDraft["accent"] }> = [
  { id: "documentary", label: "기록물", detail: "차분하고 사실적인 조사", accent: "lime" },
  { id: "tense", label: "긴장감", detail: "빠르고 불안한 추적", accent: "sky" },
  { id: "dreamy", label: "몽환적", detail: "낯설고 부드러운 발견", accent: "violet" },
  { id: "playful", label: "경쾌함", detail: "가볍고 생동감 있는 여정", accent: "coral" },
  { id: "noir", label: "누아르", detail: "차갑고 도시적인 미스터리", accent: "violet" },
  { id: "eerie", label: "기묘함", detail: "익숙한 공간의 낯선 감각", accent: "sky" },
  { id: "warm", label: "따뜻함", detail: "편안하고 다정한 관계", accent: "coral" },
  { id: "epic", label: "장엄함", detail: "큰 발견과 모험의 고조", accent: "lime" },
];

export const toneColorRecommendations: Record<GameTone, GameColors> = {
  documentary: { primary: "#79F0BD", secondary: "#0D1C19", special: "#F5C867", text: "#F7FFF9", background: "#07110F", forbidden: "#FF5D6C" },
  tense: { primary: "#55B9DF", secondary: "#193B51", special: "#E8D36F", text: "#122B3A", background: "#EEF8FC", forbidden: "#FF7A6A" },
  dreamy: { primary: "#9C7DE5", secondary: "#40316E", special: "#F2C770", text: "#2B2340", background: "#F6F0FF", forbidden: "#B7FF3C" },
  playful: { primary: "#F18454", secondary: "#254451", special: "#F3D66D", text: "#1C2D33", background: "#FFF6E9", forbidden: "#A65AF3" },
  noir: { primary: "#88728C", secondary: "#25222D", special: "#C5A56A", text: "#E7E2DD", background: "#18171D", forbidden: "#65D9D0" },
  eerie: { primary: "#B93545", secondary: "#231B25", special: "#D7D0C5", text: "#EEE9E0", background: "#151115", forbidden: "#F8E71C" },
  warm: { primary: "#E685A9", secondary: "#74424D", special: "#F2D9A1", text: "#39252D", background: "#FFF5F7", forbidden: "#28B9D5" },
  epic: { primary: "#D8893B", secondary: "#27443E", special: "#F3D66D", text: "#20352B", background: "#FFF7E9", forbidden: "#A65AF3" },
};

export const themeIdentityDefaults: Record<GameTheme, Pick<GameDraft, "tone" | "accent">> = {
  mystery: { tone: "documentary", accent: "lime" },
  horror: { tone: "eerie", accent: "violet" },
  fantasy: { tone: "dreamy", accent: "violet" },
  adventure: { tone: "epic", accent: "lime" },
  romance: { tone: "warm", accent: "coral" },
};

const themePrefixes: Record<GameTheme, string> = { mystery: "CASE", horror: "NIGHT", fantasy: "MYTH", adventure: "ROUTE", romance: "LETTER" };

export function getAutomaticCaseNumber(title: string, theme: GameTheme) {
  const score = Array.from(title).reduce((total, character) => total + character.charCodeAt(0), 0);
  return `${themePrefixes[theme]}-${String((score % 900) + 100)}`;
}

export const sceneTemplates: Array<{ id: SceneTemplateId; name: string; description: string; symbol: string; tone?: GameTone }> = [
  { id: "none", name: "연출 없음", description: "애니메이션 없이 장면 내용을 바로 보여줘요.", symbol: "01" },
  { id: "briefing", name: "기록 전송", description: "신호와 전송 패널이 차분하게 열려요.", symbol: "02", tone: "documentary" },
  { id: "ordering", name: "긴급 신호", description: "빠른 신호와 경고 카드가 진입해요.", symbol: "03", tone: "tense" },
  { id: "dreamy", name: "파동", description: "화면 중앙에서 파동이 퍼지며 장면이 열려요.", symbol: "04", tone: "dreamy" },
  { id: "playful", name: "스티커 팝", description: "오브젝트가 튀어 오르며 장면을 열어요.", symbol: "05", tone: "playful" },
  { id: "archive", name: "암전 기록", description: "어둠 속 기록 카드가 순서대로 나타나요.", symbol: "06", tone: "noir" },
  { id: "scan", name: "이상 감지", description: "불안한 스캔 선으로 화면을 열어요.", symbol: "07", tone: "eerie" },
  { id: "warm", name: "편지 도착", description: "봉투와 메시지가 부드럽게 도착해요.", symbol: "08", tone: "warm" },
  { id: "epic", name: "원정 개시", description: "길과 표식이 넓게 펼쳐지며 시작돼요.", symbol: "09", tone: "epic" },
  { id: "field", name: "현장 조사 개방", description: "DROP LINK 전송 뒤 지도와 조사 목표가 열려요.", symbol: "10" },
  { id: "ending", name: "증거물 발견", description: "발견 신호와 함께 결과 화면이 열려요.", symbol: "11" },
  { id: "portal", name: "균열 개방", description: "갈라진 빛 사이로 장면이 극적으로 열려요.", symbol: "12" },
];

export const gameMechanics: GameMechanic[] = [
  { id: "none", category: "quiz", label: "기믹 없음", description: "별도 플레이 방식 없이 내용만 전달합니다.", capability: "내용", estimatedMinutes: 0, configFields: [] },
  { id: "gps-arrival", category: "gps", label: "GPS 현장 도착", description: "정해진 반경 안에 도착하면 장면이 열립니다.", capability: "GPS", estimatedMinutes: 5, configFields: [] },
  { id: "direction-tracking", category: "gps", label: "방향 추적", description: "시작 지점에서 나침반을 따라 목표를 찾습니다.", capability: "GPS · 나침반", estimatedMinutes: 4, configFields: [{ key: "targetName", label: "추적 대상", description: "플레이어가 따라갈 신호 또는 대상", input: "text", defaultValue: "기린의 잔류 신호" }, { key: "startName", label: "시작 위치 이름", description: "방향 추적이 시작되는 장소", input: "text", defaultValue: "시계탑 앞 광장" }, { key: "startAddress", label: "시작 위치 주소", description: "제작자가 시작 지점을 다시 찾을 수 있는 주소", input: "text", defaultValue: "서울 광진구 능동로 120" }, { key: "startLatitude", label: "시작 위치 위도", description: "지도에서 핀을 찍으면 자동으로 입력됩니다.", input: "number", defaultValue: "37.550416" }, { key: "startLongitude", label: "시작 위치 경도", description: "지도에서 핀을 찍으면 자동으로 입력됩니다.", input: "number", defaultValue: "127.073818" }, { key: "startRadius", label: "시작 인정 반경", description: "이 반경 안에서 방향 추적을 시작할 수 있습니다.", input: "number", defaultValue: "20", suffix: "m" }, { key: "direction", label: "출발 방향", description: "시작 지점에서 플레이어에게 안내할 방향", input: "select", defaultValue: "N", options: [{ value: "N", label: "북" }, { value: "NE", label: "북동" }, { value: "E", label: "동" }, { value: "SE", label: "남동" }, { value: "S", label: "남" }, { value: "SW", label: "남서" }, { value: "W", label: "서" }, { value: "NW", label: "북서" }] }] },
  { id: "image-scan", category: "ar", label: "이미지 인식", description: "정해진 GPS 범위에서 기준 이미지를 카메라로 인식합니다.", capability: "GPS · 카메라 · 이미지 인식", estimatedMinutes: 4, configFields: [{ key: "targetDescription", label: "인식 이미지 설명", description: "플레이어가 현실에서 찾을 포스터, 조형물, 간판 등", input: "text", defaultValue: "노란 기린 포스터" }, { key: "actionLabel", label: "카메라 실행 버튼", description: "플레이어가 인식 카메라를 열 때 누를 버튼 문구", input: "text", defaultValue: "이미지 인식 시작" }, { key: "successMessage", label: "성공 안내", description: "이미지 인식 뒤 표시할 문장", input: "text", defaultValue: "기린의 흔적을 발견했습니다." }] },
  { id: "ar-treasure", category: "ar", label: "AR 보물찾기", description: "GPS 범위 안에서 바닥을 비추면 숨은 보물을 발견합니다.", capability: "GPS · 카메라 · 바닥 인식", estimatedMinutes: 4, configFields: [{ key: "treasureName", label: "발견할 보물", description: "바닥에서 발견할 보물의 이름", input: "text", defaultValue: "빛나는 기린 발자국" }, { key: "actionLabel", label: "보물 찾기 버튼", description: "플레이어가 AR 카메라를 열 때 누를 버튼 문구", input: "text", defaultValue: "바닥에서 보물 찾기" }, { key: "successMessage", label: "발견 안내", description: "보물을 발견한 뒤 표시할 문장", input: "text", defaultValue: "바닥에서 숨은 보물을 발견했습니다." }] },
  { id: "card-ordering", category: "quiz", label: "카드 배열", description: "자료를 끌어 원하는 순서로 배열합니다.", capability: "터치 · 드래그", estimatedMinutes: 4, configFields: [{ key: "rule", label: "안내 문구", description: "시간순, 거리순, 인과관계 등", input: "text", defaultValue: "목격 시각이 이른 순서" }, { key: "successMessage", label: "정답 문구", description: "배열을 완료하면 보여줄 문구", input: "text", defaultValue: "기록의 순서를 복원했습니다." }] },
  { id: "text-answer", category: "quiz", label: "정답 문자열 입력", description: "정답 문구를 직접 입력해 다음 순서로 진행합니다.", capability: "문자 입력", estimatedMinutes: 2, configFields: [{ key: "question", label: "문제 안내", description: "플레이어에게 보여줄 질문 또는 안내", input: "text", defaultValue: "기록에서 발견한 암호를 입력하세요." }, { key: "inputPlaceholder", label: "입력창 안내", description: "입력창에 표시할 힌트", input: "text", defaultValue: "정답을 입력하세요" }, { key: "answer", label: "정답 문자열", description: "대소문자와 띄어쓰기를 구분해 판정할 정답", input: "text", defaultValue: "기린" }, { key: "actionLabel", label: "확인 버튼", description: "정답을 제출할 버튼 문구", input: "text", defaultValue: "확인" }, { key: "successMessage", label: "정답 문구", description: "정답을 맞히면 보여줄 문구", input: "text", defaultValue: "정답입니다." }] },
];

export const defaultMechanicByTemplate: Record<SceneTemplateId, GameMechanicId> = { briefing: "none", field: "gps-arrival", archive: "image-scan", ordering: "card-ordering", scan: "image-scan", ending: "none", dreamy: "ar-treasure", playful: "none", warm: "none", epic: "direction-tracking", portal: "ar-treasure", none: "none" };

export function getSceneMechanic(scene: MakerScene) {
  const mechanicId = scene.mechanicType ?? defaultMechanicByTemplate[scene.template];
  return gameMechanics.find((mechanic) => mechanic.id === mechanicId) ?? gameMechanics[0];
}

export function getSceneEstimatedMinutes(scene: MakerScene) {
  return getSceneMechanic(scene).estimatedMinutes;
}

export function getDefaultMechanicConfig(mechanicId: GameMechanicId) {
  const mechanic = gameMechanics.find((item) => item.id === mechanicId) ?? gameMechanics[0];
  const config = Object.fromEntries(mechanic.configFields.map((field) => [field.key, field.defaultValue ?? ""]));
  if (mechanic.category !== "ar") return config;
  return { ...config, arPlaceName: "AR 조사 지점", arAddress: "", arLatitude: "37.550416", arLongitude: "127.073818", arRadius: "20" };
}

export function getArActionLabel(mechanicId: GameMechanicId, config?: Record<string, string>) {
  if (config?.actionLabel) return config.actionLabel;
  return ({ "image-scan": "이미지 인식 시작", "ar-treasure": "바닥에서 보물 찾기" } as Partial<Record<GameMechanicId, string>>)[mechanicId] ?? "AR 시작";
}

export const defaultGiraffeDraft: GameDraft = {
  id: "giraffe-investigation-draft",
  title: "시계탑 기린 목격 사건",
  caseNumber: "CD-SJ-01",
  summary: "시계탑 주변에 남은 세 건의 기록을 추적해, 사라지는 기린의 정체를 밝혀내세요.",
  coverAsset: "/gfPhoto_03.png",
  theme: "mystery",
  tone: "documentary",
  accent: "lime",
  colors: toneColorRecommendations.documentary,
  estimatedMinutes: 32,
  chapterEvidence: {
    witness: [
      { id: "evidence-record-01", name: "시계탑 목격 기록 묶음", imageUrl: "/gfPhoto_01.png" },
    ],
  },
  chapterEvidenceEnabled: { witness: true },
  scenes: [
    {
      id: "briefing", chapter: "CHAPTER 1", chapterName: "낯선 목격의 시작", template: "briefing", title: "목격 신고 접수", subtitle: "사건 개요", body: "DROPLINK를 통해 시계탑 기린 목격 사건의 조사원이 됩니다.", mechanic: "기믹 없음", mechanicType: "none", mechanicConfig: {},
      contentBlocks: [
        { id: "briefing-case", format: "card", label: "조사 목표", title: "첫 번째 목격 지점을 확인하세요.", body: "목격 시각은 오후 4시 12분. 현장 반경 안에서 노란 털의 신호를 찾아야 합니다." },
      ],
      flowOrder: ["briefing-case", "mechanic"],
      endingMode: "messenger",
      endingConfig: { messengerSender: "DROPLINK", messengerNotice: "새 사건 파일이 도착했습니다.", messengerMessages: '["시계탑 잔디밭에서 정체불명의 기린이 목격됐습니다.", "현장에 남은 흔적을 확인해 주세요."]' },
      duration: 2,
    },
    { id: "arrival", chapter: "CHAPTER 2", chapterName: "잔디밭 조사", template: "field", title: "첫 번째 조사 지점", subtitle: "현장 도착", body: "시계탑 잔디밭 반경 안에 들어가 노란 털의 신호를 찾습니다.", mechanic: "GPS 현장 도착", mechanicType: "gps-arrival", mechanicConfig: { gpsLocations: '[{"id":"gps-location-1","name":"시계탑 잔디밭","address":"서울 광진구 능동로 120","latitude":"37.550416","longitude":"127.073818","radius":"20","rewardType":"image","rewardAsset":"/GFfur.png","rewardAssetName":"노란 털 한 올"}]', placeName: "시계탑 잔디밭", address: "서울 광진구 능동로 120", latitude: "37.550416", longitude: "127.073818", radius: "20" }, contentBlocks: [{ id: "arrival-guide", format: "text", label: "현장 안내", body: "지도에 표시된 조사 지점에서 노란 털의 신호를 확인하세요." }, { id: "arrival-message", format: "droplink", sender: "DROPLINK", notification: "현장 신호가 감지되었습니다.", messages: ["잔디밭에서 약한 노란빛이 포착됐습니다.", "표식 가까이 다가가 확인해 주세요."] }], flowOrder: ["arrival-guide", "arrival-message", "mechanic"], endingMode: "submission", endingConfig: { submissionTitle: "증거물을 제출하고 있습니다", submissionBody: "현장에서 확보한 기린의 털을 사건 기록에 등록합니다.", submissionDuration: "3", submissionActionLabel: "증거물 제출하기" }, duration: 5 },
    { id: "records", chapter: "CHAPTER 3", chapterName: "잔류 이미지", template: "scan", title: "사라진 윤곽", subtitle: "이미지 인식", body: "현장 사진에 남은 흐릿한 윤곽을 카메라로 인식합니다.", mechanic: "이미지 · 표식 스캔", mechanicType: "image-scan", mechanicConfig: { targetDescription: "시계탑 벽면의 노란 기린 포스터", successMessage: "이미지 속에서 기린의 흔적을 발견했습니다." }, contentBlocks: [{ id: "records-card", format: "card", label: "현장 기록", title: "사진 한 장이 사라졌습니다.", body: "목격자는 사진을 찍은 직후, 기린의 윤곽만 흐려졌다고 말했습니다.", imageUrl: "/gfPhoto_03-no-giraffe.png", imageName: "목격 사진" }, { id: "records-message", format: "droplink", sender: "DROPLINK", notification: "이미지 분석 요청", messages: ["포스터에 남은 윤곽을 카메라로 비춰 주세요.", "인식 결과는 즉시 사건 기록에 추가됩니다."] }, { id: "records-npc", format: "modal", modalType: "npc", sender: "목격자 윤서", messages: ["사진 속 기린이 움직인 것 같았어요.", "노란 빛이 시계탑 안쪽으로 이어졌습니다."], npcImage: "/gfPhoto_02.png", npcImageName: "목격자 윤서" }], flowOrder: ["records-card", "records-message", "mechanic", "records-npc"], endingMode: "submission", endingConfig: { submissionTitle: "이미지를 분석하고 있습니다", submissionBody: "윤곽의 이동 경로를 정리하고 있습니다.", submissionDuration: "3", submissionActionLabel: "이미지 분석 시작" }, duration: 4 },
    { id: "witness", chapter: "CHAPTER 4", chapterName: "과거 기록 수집", template: "field", title: "여러 사람이 그린 하나의 기린", subtitle: "세 곳의 신호", body: "지도에 표시된 세 지점에서 서로 다른 시기의 목격 기록을 확보합니다.", mechanic: "GPS 현장 도착", mechanicType: "gps-arrival", mechanicConfig: { gpsLocations: '[{"id":"witness-c","name":"동쪽 진입로","address":"시계탑 동쪽 진입로","latitude":"37.550652","longitude":"127.074831","radius":"10","rewardType":"image","rewardAsset":"/gfPhoto_01.png","rewardAssetName":"오래된 학생수첩의 낙서"},{"id":"witness-b","name":"북쪽 보행로","address":"시계탑 북쪽 보행로","latitude":"37.551432","longitude":"127.073717","radius":"10","rewardType":"image","rewardAsset":"/gfPhoto_02.png","rewardAssetName":"동아리 회지의 삽화"},{"id":"witness-a","name":"잔디밭 남서쪽","address":"시계탑 잔디밭 남서쪽","latitude":"37.550094","longitude":"127.073620","radius":"10","rewardType":"image","rewardAsset":"/gfPhoto_03.png","rewardAssetName":"익명 게시판의 목격담"}]', placeName: "동쪽 진입로", address: "시계탑 동쪽 진입로", latitude: "37.550652", longitude: "127.074831", radius: "10" }, contentBlocks: [{ id: "witness-card", format: "card", label: "2장", title: "세 건의 기록을 확보하세요.", body: "각 기록은 서로 다른 시기에 작성됐습니다. 세 곳을 조사한 뒤 시간적 순서를 복원합니다.", imageUrl: "/gfPhoto_03.png", imageName: "최근 목격 기록" }, { id: "witness-message", format: "droplink", sender: "DROPLINK", notification: "과거 기록 조회 완료", messages: ["기록의 작성 시점 정보가 일부 손상되어 있습니다.", "자료 이미지 세 건을 모두 확보해 주세요."] }], flowOrder: ["witness-card", "witness-message", "mechanic"], endingMode: "none", duration: 5 },
    { id: "order", chapter: "CHAPTER 4", chapterName: "기록 복원", template: "ordering", title: "목격 순서 복원", subtitle: "기록 배열", body: "세 개의 기록을 목격 시각 순서대로 배열해 기린의 이동 경로를 복원합니다.", mechanic: "카드 배열", mechanicType: "card-ordering", mechanicConfig: { rule: "목격 시각이 이른 순서로 카드를 배열하세요.", successMessage: "기록의 순서를 복원했습니다.", orderingCards: '[{"id":"card-1","imageUrl":"/gfPhoto_03-no-giraffe.png"},{"id":"card-2","imageUrl":"/gfPhoto_02-no-giraffe.png"},{"id":"card-3","imageUrl":"/gfPhoto_01-no-giraffe.png"}]' }, contentBlocks: [{ id: "order-note", format: "text", label: "기록 보관함", body: "각 사진의 빛 방향과 목격 시각을 비교해 보세요." }, { id: "order-card", format: "card", label: "배열 기준", title: "기록의 시간대를 복원하세요.", body: "사진에 남은 그림자 길이가 짧을수록 목격 시각은 이릅니다.", imageUrl: "/gfPhoto_01.png", imageName: "첫 번째 목격 사진" }, { id: "order-npc", format: "modal", modalType: "npc", sender: "목격자 윤서", messages: ["세 장 모두 같은 날 찍은 사진이에요.", "그림자가 가장 짧은 사진부터 정리해 보세요."], npcImage: "/gfPhoto_02.png", npcImageName: "목격자 윤서" }], flowOrder: ["order-note", "order-card", "order-npc", "mechanic"], endingMode: "messenger", endingConfig: { messengerSender: "DROPLINK", messengerNotice: "새로운 메시지가 도착했습니다.", messengerMessages: '["기린은 시계탑 안쪽으로 이동했습니다.", "마지막 신호를 확인해 주세요."]' }, duration: 4 },
    { id: "feature", chapter: "CHAPTER 5", chapterName: "외형 변화", template: "archive", title: "외형 변화 보고", subtitle: "기록 재분석", body: "시간순으로 정렬된 기록에서 새롭게 나타난 외형 특징을 찾아냅니다.", mechanic: "정답 문자열 입력", mechanicType: "text-answer", mechanicConfig: { question: "기린에게 새롭게 나타난 특징을 영문으로 입력하세요.", inputPlaceholder: "영문 정답 입력", answer: "STAR", actionLabel: "분석 보고 제출", successMessage: "강조 단어가 확인되었습니다." }, contentBlocks: [{ id: "feature-card", format: "card", label: "시각 비교", title: "기록 속 별 모양을 확인하세요.", body: "최초 기록에는 없던 작은 별이 이후 기록에서 반복되어 나타납니다.", imageUrl: "/gfPhoto_02.png", imageName: "별 모양이 나타난 기록" }, { id: "feature-message", format: "droplink", sender: "운영본부", notification: "추가 분석 지시", messages: ["기록 사이의 외형 차이를 보고해 주세요.", "특별한 특징은 영문으로 입력합니다."] }], flowOrder: ["feature-card", "feature-message", "mechanic"], endingMode: "none", duration: 2 },
    { id: "restore", chapter: "CHAPTER 6", chapterName: "상상의 흔적", template: "portal", title: "기록 복원", subtitle: "바닥의 흔적", body: "시계탑 주변 바닥에 남은 빛을 따라 기린이 처음 만들어진 순간을 확인합니다.", mechanic: "AR 보물찾기", mechanicType: "ar-treasure", mechanicConfig: { treasureName: "훼손된 학생수첩의 빛 조각", arPlaceName: "시계탑 앞 산책로", arAddress: "서울 광진구 능동로 120", arLatitude: "37.550416", arLongitude: "127.073818", arRadius: "20", actionLabel: "바닥에서 기록 찾기", successMessage: "바닥에서 기록의 빛 조각을 발견했습니다." }, contentBlocks: [{ id: "restore-card", format: "card", label: "증거물 01", title: "바닥의 빛을 따라가세요.", body: "먼지 아래에는 누군가 시계탑을 보며 기린을 상상한 첫 기록이 남아 있습니다.", imageUrl: "/gfPhoto_01-no-giraffe.png", imageName: "훼손된 학생수첩 기록" }, { id: "restore-progress", format: "modal", modalType: "progress", label: "복원 상태", title: "기록을 다시 조립하고 있습니다", body: "훼손된 표면과 문자 정보를 대조합니다.", modalProgress: 72 }], flowOrder: ["restore-card", "mechanic", "restore-progress"], endingMode: "messenger", endingConfig: { messengerSender: "DROPLINK", messengerNotice: "복원 결과가 도착했습니다.", messengerMessages: '["Everything you can imagine is real.", "기록에서 개체 정보가 다시 감소하고 있습니다."]' }, duration: 4 },
    { id: "empty-record", chapter: "CHAPTER 7", chapterName: "비어 있는 기록", template: "scan", title: "정보 손실", subtitle: "수동 복원", body: "기린이 있던 영역만 사라진 세 장의 기록을 다시 확인합니다.", mechanic: "정답 문자열 입력", mechanicType: "text-answer", mechanicConfig: { question: "복원된 페이지의 강조 단어를 영문으로 입력하세요.", inputPlaceholder: "영문 정답 입력", answer: "IMAGINE", actionLabel: "복원 결과 제출", successMessage: "상상과 이후 기록 사이의 연결을 확인했습니다." }, contentBlocks: [{ id: "empty-card", format: "card", label: "수동 복원 도구", title: "개체가 있던 위치를 기억하세요.", body: "배경과 문자 정보에는 변화가 없지만, 기린으로 분류된 영역에서만 정보 손실이 감지됩니다.", imageUrl: "/gfPhoto_03-no-giraffe.png", imageName: "기린이 사라진 기록" }, { id: "empty-message", format: "droplink", sender: "DROPLINK", notification: "개체 안정성 경고", messages: ["현재 방식으로는 복원 상태를 유지할 수 없습니다.", "시계탑 인근 잔류 패턴의 출처를 추적합니다."] }], flowOrder: ["empty-card", "empty-message", "mechanic"], endingMode: "none", duration: 2 },
    { id: "ending", chapter: "FINALE", chapterName: "기린과의 첫 대화", template: "ending", title: "최초의 대화", subtitle: "잔류 패턴 추적", body: "특별 포스터를 인식해 기린과 연결된 미등록 통신을 엽니다.", mechanic: "이미지 인식", mechanicType: "image-scan", mechanicConfig: { targetDescription: "시계탑 인근 숨겨진 포스터", arPlaceName: "시계탑 안내판", arAddress: "서울 광진구 능동로 120", arLatitude: "37.550416", arLongitude: "127.073818", arRadius: "20", actionLabel: "DROPLINK 카메라로 조사", successMessage: "미등록 개체 정보가 카메라 화면에 표시됩니다.", scanReferenceImage: "/originGF.png", scanReferenceImageName: "잔류 패턴 포스터" }, contentBlocks: [{ id: "ending-card", format: "card", label: "잔류 패턴 탐색", title: "특별 이미지를 찾으세요.", body: "정확한 좌표보다 현장 관찰이 중요합니다. 조각과 같은 이미지를 찾으세요.", imageUrl: "/originGF.png", imageName: "잔류 패턴 포스터" }, { id: "ending-message", format: "droplink", sender: "DROPLINK", notification: "이미지 일치", messages: ["등록되지 않은 개체 정보가 카메라 화면에 표시되고 있습니다.", "3D 데이터의 생성 경로를 확인할 수 없습니다."] }, { id: "ending-npc", format: "modal", modalType: "npc", sender: "기린", messages: ["이제야 나를 직접 보고 있네.", "나는 누군가 탑을 보다가 떠올린 작은 생각에서 시작됐어.", "사람들이 나를 떠올리지 않으면 내 모습도 조금씩 흐려져."], npcImage: "/gfPhoto_03.png", npcImageName: "기린" }], flowOrder: ["ending-card", "mechanic", "ending-message", "ending-npc"], endingMode: "messenger", endingConfig: { messengerSender: "기린", messengerNotice: "새 관측 기록이 등록되었습니다.", messengerMessages: '["이번 기록은 네가 남긴 거구나.", "이제 네가 남긴 기록 속에도 내가 있을 수 있어."]' }, duration: 4 },
  ],
};

export const starterTemplates: StarterTemplate[] = [
  {
    id: "giraffe-investigation",
    name: "목격 사건 조사",
    description: "현장 기록을 모아 사라지는 기린의 정체를 추적합니다.",
    focus: "조사 · 기록 · 복원",
    draft: defaultGiraffeDraft,
  },
  {
    id: "midnight-signal",
    name: "심야 신호 추적",
    description: "한밤중 캠퍼스에 반복되는 정체불명의 신호를 따라갑니다.",
    focus: "추적 · 스캔 · 제한 시간",
    draft: {
      id: "midnight-signal-draft",
      title: "00:17, 푸른 새의 신호",
      caseNumber: "NS-0017",
      summary: "자정 이후에만 나타나는 푸른 신호를 따라, 사라진 방송의 발신자를 찾으세요.",
      coverAsset: "/gfPhoto_02.png",
      theme: "mystery",
      tone: "tense",
      accent: "sky",
      colors: toneColorRecommendations.tense,
      estimatedMinutes: 18,
      scenes: [
        { id: "signal-open", chapter: "00:17", template: "briefing", title: "수신되지 않은 방송", body: "수신함에 존재하지 않는 음성 메시지가 도착합니다. 신호는 캠퍼스 북쪽을 향합니다.", mechanic: "라디오 브리핑", duration: 2 },
        { id: "signal-field", chapter: "00:23", template: "field", title: "첫 번째 중계점", body: "지도에 표시된 중계점 반경에 도착해 신호 세기를 확인하세요.", mechanic: "GPS 추적", duration: 4 },
        { id: "signal-archive", chapter: "00:29", template: "archive", title: "새벽의 목격 사진", body: "빛 번짐 속에 남은 푸른 형체를 조사하고, 반복되는 기호를 찾아냅니다.", mechanic: "사진 단서", duration: 3 },
        { id: "signal-scan", chapter: "00:35", template: "scan", title: "마지막 수신 지점", body: "특별 이미지가 있는 방향으로 카메라를 향해 발신 지점을 고정하세요.", mechanic: "이미지 스캔", duration: 5 },
        { id: "signal-end", chapter: "00:42", template: "ending", title: "파형이 남긴 문장", body: "끊긴 방송 끝에서, 내일 밤에도 같은 시간에 만나자는 메시지를 발견합니다.", mechanic: "타임아웃 엔딩", duration: 4 },
      ],
    },
  },
  {
    id: "library-archive",
    name: "도서관 금서 기록",
    description: "찢어진 책장과 누락된 서지 정보를 복원하는 아카이브형 게임입니다.",
    focus: "열람 · 비교 · 암호",
    draft: {
      id: "library-archive-draft",
      title: "사라진 312번째 책장",
      caseNumber: "ARC-312",
      summary: "목록에는 있지만 서가에는 없는 책. 남겨진 주석을 따라 잃어버린 기록을 복원하세요.",
      coverAsset: "/originGF.png",
      theme: "fantasy",
      tone: "dreamy",
      accent: "violet",
      colors: toneColorRecommendations.dreamy,
      estimatedMinutes: 22,
      scenes: [
        { id: "archive-open", chapter: "ARCHIVE 0", template: "briefing", title: "열람 제한 통지", body: "폐기 예정 기록에서 도서관의 분류 체계와 맞지 않는 한 줄이 발견됩니다.", mechanic: "기록 열람", duration: 3 },
        { id: "archive-find", chapter: "ARCHIVE 1", template: "archive", title: "찢어진 대출 카드", body: "세 장의 대출 카드에서 반복적으로 사라진 단어를 모읍니다.", mechanic: "단어 수집", duration: 5 },
        { id: "archive-order", chapter: "ARCHIVE 2", template: "ordering", title: "서가 순서 재배열", body: "청구기호와 반납일을 비교해 책이 이동한 순서를 재구성합니다.", mechanic: "기록 배열", duration: 5 },
        { id: "archive-field", chapter: "ARCHIVE 3", template: "field", title: "숨겨진 열람실", body: "캠퍼스 지도에서 비어 있는 열람실의 위치를 확인합니다.", mechanic: "지도 탐색", duration: 4 },
        { id: "archive-end", chapter: "ARCHIVE 4", template: "ending", title: "312번째 책장", body: "사라진 책은 누군가의 상상을 기록하는, 아직 분류되지 않은 서가였습니다.", mechanic: "문장 완성", duration: 5 },
      ],
    },
  },
  {
    id: "campus-delivery",
    name: "비밀 배송 의뢰",
    description: "제한 시간 안에 단서 상자를 올바른 수령인에게 전달합니다.",
    focus: "선택 · 이동 · 전달",
    draft: {
      id: "campus-delivery-draft",
      title: "오늘 밤, 수령인을 찾습니다",
      caseNumber: "DROP-204",
      summary: "주소가 지워진 작은 상자. 세 개의 전달 단서를 연결해 마지막 수령인을 찾으세요.",
      coverAsset: "/gfPhoto_01.png",
      theme: "adventure",
      tone: "playful",
      accent: "coral",
      colors: toneColorRecommendations.playful,
      estimatedMinutes: 15,
      scenes: [
        { id: "delivery-open", chapter: "DELIVERY 1", template: "briefing", title: "주소 없는 상자", body: "수령인 이름 대신 세 개의 장소와 시간이 적힌 비밀 배송 의뢰가 도착합니다.", mechanic: "의뢰 확인", duration: 2 },
        { id: "delivery-field", chapter: "DELIVERY 2", template: "field", title: "첫 번째 전달 장소", body: "남은 시간 안에 학생회관 앞 배송 신호 반경으로 이동하세요.", mechanic: "제한 시간 이동", duration: 4 },
        { id: "delivery-scan", chapter: "DELIVERY 3", template: "scan", title: "수령 표식 찾기", body: "수령인이 남긴 표식 이미지를 카메라로 확인하세요.", mechanic: "표식 스캔", duration: 3 },
        { id: "delivery-order", chapter: "DELIVERY 4", template: "ordering", title: "전달 순서 결정", body: "단서 카드의 시간과 방향을 비교해 다음 수령인을 정합니다.", mechanic: "경로 배열", duration: 3 },
        { id: "delivery-end", chapter: "DELIVERY 5", template: "ending", title: "마지막 전달", body: "상자 안에는 내일의 자신에게 남긴 짧은 응원 메시지가 들어 있습니다.", mechanic: "선택 엔딩", duration: 3 },
      ],
    },
  },
];

export function cloneStarterDraft(templateId: string): GameDraft {
  const template = starterTemplates.find((item) => item.id === templateId) ?? starterTemplates[0];
  return JSON.parse(JSON.stringify(template.draft)) as GameDraft;
}

export function cloneDefaultDraft(): GameDraft {
  return cloneStarterDraft("giraffe-investigation");
}
