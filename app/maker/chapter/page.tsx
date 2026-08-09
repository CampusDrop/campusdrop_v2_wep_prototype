"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cloneDefaultDraft, defaultMechanicByTemplate, gameMechanicCategories, gameMechanics, getArActionLabel, getDefaultMechanicConfig, sceneTemplates, toneColorRecommendations, type ChapterEvidence, type GameMechanicId, type GameDraft, type MakerScene, type SceneEndingMode, type SceneTemplateId } from "../gameDraft";
import { loadMakerDraft, saveMakerDraft } from "../draftStorage";

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function getMechanicIdForScene(scene: MakerScene) {
  const mechanicId = scene.mechanicType ?? defaultMechanicByTemplate[scene.template];
  return gameMechanics.some((mechanic) => mechanic.id === mechanicId) ? mechanicId : "none";
}

function getEndingMessengerMessages(config: Record<string, string>) {
  try {
    const messages = JSON.parse(config.messengerMessages ?? "[]");
    if (Array.isArray(messages) && messages.length > 0 && messages.every((message) => typeof message === "string")) return messages;
  } catch { /* Older drafts store only one messenger message. */ }
  return [config.messengerMessage ?? "다음 단서를 확인해 주세요."];
}

type MakerKakaoLatLng = { getLat: () => number; getLng: () => number };
type MakerKakaoMap = { setCenter?: (position: MakerKakaoLatLng) => void };
type MakerKakaoMarker = { setMap: (map: MakerKakaoMap | null) => void; setPosition: (position: MakerKakaoLatLng) => void };
type MakerKakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => MakerKakaoLatLng;
  Map: new (container: HTMLElement, options: { center: MakerKakaoLatLng; level: number }) => MakerKakaoMap;
  Marker: new (options: { position: MakerKakaoLatLng; map?: MakerKakaoMap; title?: string }) => MakerKakaoMarker;
  event: { addListener: (target: MakerKakaoMap, eventName: "click", handler: (event: { latLng: MakerKakaoLatLng }) => void) => void };
  services?: { Geocoder: new () => { addressSearch: (address: string, callback: (result: Array<{ x: string; y: string }>, status: string) => void) => void }; Status: { OK: string } };
};

type OrderingCard = { id: string; imageUrl?: string; name?: string };
type GpsArrivalLocation = { id: string; name: string; address: string; latitude: string; longitude: string; radius: string; rewardType: "image" | "model"; rewardAsset?: string; rewardAssetName?: string };
type EvidenceModalItem = { id: string; name: string; asset?: string; assetType: "image" | "model" };
type PendingContentDraft = { label: string; title: string; body: string; sender: string; notification: string; message: string; extraMessages: string[]; actionLabel: string; modalType: "progress" | "npc"; modalProgress: number; npcImage: string; npcImageName: string; npcPresentation: "face" | "radio" | "record"; npcTextSpeed: "normal" | "fast" | "instant"; messengerImage: string; messengerImageName: string };

const MAKER_KAKAO_JAVASCRIPT_KEY = "97b8390b5c4e8c53f8504d89c5a5c8f4";
const pageEndingModes: Array<{ id: SceneEndingMode; number: string; label: string; description: string }> = [
  { id: "none", number: "0", label: "없음", description: "별도 화면 없이 다음 흐름으로 넘어갑니다." },
  { id: "submission", number: "1", label: "진행률", description: "제출·분석 과정을 표시합니다." },
  { id: "messenger", number: "2", label: "메신저 대화", description: "다음 안내를 메신저 팝업으로 전달합니다." },
];

function createPendingContentDraft(format: "card" | "droplink" | "modal"): PendingContentDraft {
  if (format === "card") return { label: "안내", title: "", body: "", sender: "", notification: "", message: "", extraMessages: [], actionLabel: "확인", modalType: "progress", modalProgress: 65, npcImage: "", npcImageName: "", npcPresentation: "face", npcTextSpeed: "normal", messengerImage: "", messengerImageName: "" };
  if (format === "droplink") return { label: "", title: "", body: "", sender: "DROPLINK", notification: "새로운 메시지가 도착했습니다.", message: "", extraMessages: [], actionLabel: "확인", modalType: "progress", modalProgress: 65, npcImage: "", npcImageName: "", npcPresentation: "face", npcTextSpeed: "normal", messengerImage: "", messengerImageName: "" };
  return { label: "", title: "", body: "", sender: "NPC", notification: "", message: "", extraMessages: [], actionLabel: "확인", modalType: "npc", modalProgress: 65, npcImage: "", npcImageName: "", npcPresentation: "face", npcTextSpeed: "normal", messengerImage: "", messengerImageName: "" };
}

function getGpsArrivalLocations(config: Record<string, string>) {
  try {
    const locations = JSON.parse(config.gpsLocations ?? "[]") as GpsArrivalLocation[];
    if (Array.isArray(locations) && locations.length > 0) return locations.slice(0, 3);
  } catch { /* Older drafts use one location field set. */ }
  return [{ id: "gps-location-1", name: config.placeName ?? "시계탑 잔디밭", address: config.address ?? "서울 광진구 능동로 120", latitude: config.latitude ?? "37.550416", longitude: config.longitude ?? "127.073818", radius: config.radius ?? "20", rewardType: "image" as const }];
}

function getMechanicEvidence(scene: MakerScene): EvidenceModalItem[] {
  const config = scene.mechanicConfig ?? {};
  if (scene.mechanicType === "gps-arrival") return getGpsArrivalLocations(config).filter((location) => location.rewardAsset).map((location) => ({ id: location.id, name: location.rewardAssetName || `${location.name} 증거물`, asset: location.rewardAsset, assetType: location.rewardType }));
  if (config.rewardAsset) return [{ id: `mechanic-${scene.id}`, name: config.rewardAssetName || "획득 증거물", asset: config.rewardAsset, assetType: config.rewardType === "model" ? "model" : "image" }];
  return [];
}

function LocationPicker({ title, guide, latitude, longitude, placeName, address, onLocationChange }: { title: string; guide: string; latitude: string; longitude: string; placeName: string; address: string; onLocationChange: (latitude: string, longitude: string) => void }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MakerKakaoMap | null>(null);
  const markerRef = useRef<MakerKakaoMarker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const initialLocationRef = useRef({ latitude: Number(latitude) || 37.550416, longitude: Number(longitude) || 127.073818, placeName });
  const [mapState, setMapState] = useState<"loading" | "ready" | "fallback">("loading");
  const [searchMessage, setSearchMessage] = useState("");
  const getKakaoMaps = () => (window as unknown as { kakao?: { maps: MakerKakaoMapsApi } }).kakao?.maps;

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    const initialLocation = initialLocationRef.current;
    let cancelled = false;
    const renderMap = () => {
      const maps = getKakaoMaps();
      if (cancelled || !maps || !mapElementRef.current) return;
      const position = new maps.LatLng(initialLocation.latitude, initialLocation.longitude);
      const map = new maps.Map(mapElementRef.current, { center: position, level: 3 });
      mapRef.current = map;
      markerRef.current = new maps.Marker({ position, map, title: initialLocation.placeName || "현장 위치" });
      maps.event.addListener(map, "click", (event) => {
        const nextLatitude = event.latLng.getLat();
        const nextLongitude = event.latLng.getLng();
        markerRef.current?.setPosition(event.latLng);
        onLocationChangeRef.current(nextLatitude.toFixed(6), nextLongitude.toFixed(6));
      });
      setMapState("ready");
    };

    const maps = getKakaoMaps();
    if (maps) {
      maps.load(renderMap);
      return () => { cancelled = true; };
    }

    const existingScript = document.querySelector<HTMLScriptElement>("#kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => getKakaoMaps()?.load(renderMap), { once: true });
      return () => { cancelled = true; };
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(MAKER_KAKAO_JAVASCRIPT_KEY)}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => getKakaoMaps()?.load(renderMap);
    script.onerror = () => setMapState("fallback");
    document.head.appendChild(script);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const maps = getKakaoMaps();
    const nextLatitude = Number(latitude);
    const nextLongitude = Number(longitude);
    if (!maps || !mapRef.current || !markerRef.current || !Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) return;
    const position = new maps.LatLng(nextLatitude, nextLongitude);
    markerRef.current.setPosition(position);
    mapRef.current.setCenter?.(position);
  }, [latitude, longitude]);

  function searchAddress() {
    const maps = getKakaoMaps();
    if (!address.trim()) {
      setSearchMessage("먼저 주소를 입력해 주세요.");
      return;
    }
    if (!maps?.services) {
      setSearchMessage("주소 검색을 준비하지 못했습니다. 지도에서 직접 핀을 지정해 주세요.");
      return;
    }
    setSearchMessage("주소를 찾는 중입니다.");
    new maps.services.Geocoder().addressSearch(address, (result, status) => {
      if (status !== maps.services?.Status.OK || !result[0]) {
        setSearchMessage("해당 주소를 찾지 못했습니다. 지도에서 직접 핀을 지정해 주세요.");
        return;
      }
      const nextLatitude = Number(result[0].y);
      const nextLongitude = Number(result[0].x);
      const position = new maps.LatLng(nextLatitude, nextLongitude);
      markerRef.current?.setPosition(position);
      mapRef.current?.setCenter?.(position);
      onLocationChangeRef.current(nextLatitude.toFixed(6), nextLongitude.toFixed(6));
      setSearchMessage("주소 위치로 핀을 옮겼습니다.");
    });
  }

  return <section className="maker-gps-location-picker" aria-label={`${title} 지도`}>
    <div className="maker-gps-location-heading"><div><span>{title}</span><strong>주소를 찾거나 지도에서 핀을 지정하세요.</strong></div><button type="button" onClick={searchAddress}>주소로 지도 이동</button></div>
    <div className="maker-gps-map" ref={mapElementRef}>{mapState !== "ready" && <div className="maker-gps-map-message">{mapState === "fallback" ? "지도를 불러오지 못했습니다. 위도와 경도를 직접 입력해 주세요." : "지도를 불러오는 중입니다."}</div>}</div>
    <p>{searchMessage || guide}</p>
  </section>;
}

function LiveGpsMap({ latitude, longitude, placeName }: { latitude: string; longitude: string; placeName: string }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MakerKakaoMap | null>(null);
  const markerRef = useRef<MakerKakaoMarker | null>(null);
  const initialLocationRef = useRef({ latitude, longitude, placeName });
  const [mapState, setMapState] = useState<"loading" | "ready" | "fallback">("loading");
  const getKakaoMaps = () => (window as unknown as { kakao?: { maps: MakerKakaoMapsApi } }).kakao?.maps;

  useEffect(() => {
    let cancelled = false;
    const initialLocation = initialLocationRef.current;
    const renderMap = () => {
      const maps = getKakaoMaps();
      if (cancelled || !maps || !mapElementRef.current) return;
      const position = new maps.LatLng(Number(initialLocation.latitude) || 37.550416, Number(initialLocation.longitude) || 127.073818);
      const map = new maps.Map(mapElementRef.current, { center: position, level: 3 });
      mapRef.current = map;
      markerRef.current = new maps.Marker({ position, map, title: initialLocation.placeName || "조사 지점" });
      setMapState("ready");
    };
    const maps = getKakaoMaps();
    if (maps) {
      maps.load(renderMap);
      return () => { cancelled = true; };
    }
    const existingScript = document.querySelector<HTMLScriptElement>("#kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => getKakaoMaps()?.load(renderMap), { once: true });
      return () => { cancelled = true; };
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(MAKER_KAKAO_JAVASCRIPT_KEY)}&autoload=false`;
    script.async = true;
    script.onload = () => getKakaoMaps()?.load(renderMap);
    script.onerror = () => setMapState("fallback");
    document.head.appendChild(script);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const maps = getKakaoMaps();
    const nextLatitude = Number(latitude);
    const nextLongitude = Number(longitude);
    if (!maps || !mapRef.current || !markerRef.current || !Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) return;
    const position = new maps.LatLng(nextLatitude, nextLongitude);
    markerRef.current.setPosition(position);
    mapRef.current.setCenter?.(position);
  }, [latitude, longitude]);

  return <div className="maker-preview-gps-map" aria-label={`${placeName || "조사 지점"} 지도`}>
    <div className="maker-preview-gps-map-canvas" ref={mapElementRef} />
    {mapState !== "ready" && <div className="maker-preview-gps-map-fallback">{mapState === "fallback" ? "지도를 불러오지 못했습니다." : "지도를 불러오는 중입니다."}</div>}
    <div className="maker-preview-gps-map-label"><span>조사 지점</span><strong>{placeName || "현장 이름"}</strong></div>
  </div>;
}

export default function ChapterMakerPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<GameDraft>(cloneDefaultDraft);
  const [selectedSceneId, setSelectedSceneId] = useState(() => cloneDefaultDraft().scenes[0].id);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [isPresentationPlaying, setIsPresentationPlaying] = useState(false);
  const [isPresentationEditorOpen, setIsPresentationEditorOpen] = useState(true);
  const [isMechanicEditorOpen, setIsMechanicEditorOpen] = useState(true);
  const [pendingMechanicId, setPendingMechanicId] = useState<GameMechanicId>("none");
  const [pendingContentFormat, setPendingContentFormat] = useState<"card" | "droplink" | "modal">("card");
  const [pendingContentDraft, setPendingContentDraft] = useState<PendingContentDraft>(() => createPendingContentDraft("card"));
  const [editingContentBlockId, setEditingContentBlockId] = useState<string | null>(null);
  const [openedMessengerBlockId, setOpenedMessengerBlockId] = useState<string | null>(null);
  const [isPendingMessengerPreviewOpen, setIsPendingMessengerPreviewOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [selectedContentBlockId, setSelectedContentBlockId] = useState<string | null>(null);
  const [draggedFlowId, setDraggedFlowId] = useState<string | null>(null);
  const [previewEvidenceItems, setPreviewEvidenceItems] = useState<EvidenceModalItem[] | null>(null);
  const [previewEvidenceIndex, setPreviewEvidenceIndex] = useState(0);
  const [isPreviewSubmissionOpen, setIsPreviewSubmissionOpen] = useState(false);
  const [isPreviewSubmissionComplete, setIsPreviewSubmissionComplete] = useState(false);
  const orderingCardSequenceRef = useRef(4);

  useEffect(() => {
    let isActive = true;
    window.queueMicrotask(() => {
      if (!isActive) return;
      const storedDraft = loadMakerDraft();
      setDraft(storedDraft);
      setSelectedSceneId(storedDraft.scenes[0].id);
      setPendingMechanicId(getMechanicIdForScene(storedDraft.scenes[0]));
    });
    return () => { isActive = false; };
  }, []);

  const selectedScene = draft.scenes.find((scene) => scene.id === selectedSceneId) ?? draft.scenes[0];
  const selectedTemplate = sceneTemplates.find((template) => template.id === selectedScene.template)!;
  const storedMechanicId = selectedScene.mechanicType ?? defaultMechanicByTemplate[selectedScene.template];
  const appliedMechanicId = gameMechanics.some((mechanic) => mechanic.id === storedMechanicId) ? storedMechanicId : "none";
  const appliedMechanic = gameMechanics.find((mechanic) => mechanic.id === appliedMechanicId)!;
  const selectedMechanicId = gameMechanics.some((mechanic) => mechanic.id === pendingMechanicId) ? pendingMechanicId : appliedMechanicId;
  const selectedMechanic = gameMechanics.find((mechanic) => mechanic.id === selectedMechanicId)!;
  const orderingCards: OrderingCard[] = (() => {
    try {
      const stored = JSON.parse(selectedScene.mechanicConfig?.orderingCards ?? "[]") as OrderingCard[];
      if (Array.isArray(stored) && stored.length) return stored;
    } catch { /* Start with blank cards when the saved draft used an older format. */ }
    return Array.from({ length: 3 }, (_, index) => ({ id: `card-${index + 1}` }));
  })();
  const gpsArrivalLocations = getGpsArrivalLocations(selectedScene.mechanicConfig ?? {});
  const legacyContentBlock = selectedScene.content ?? { id: "content-initial", format: "text" as const, label: "안내", title: "", body: selectedScene.body, sender: "DROPLINK", notification: "새로운 메시지가 도착했습니다.", messages: [selectedScene.body], actionLabel: "확인" };
  const contentBlocks = selectedScene.contentBlocks?.length ? selectedScene.contentBlocks : [{ ...legacyContentBlock, id: legacyContentBlock.id ?? "content-initial" }];
  const sceneContent = contentBlocks.find((block) => block.id === selectedContentBlockId) ?? contentBlocks[0];
  const contentMessages = sceneContent.messages?.length ? sceneContent.messages : [selectedScene.body || ""];
  const flowOrder = selectedScene.flowOrder?.length ? selectedScene.flowOrder : ["mechanic", ...contentBlocks.map((block) => block.id!)];
  const presentationContent = selectedScene.presentation?.content ?? "";
  const isTitleVisible = selectedScene.isTitleVisible !== false;
  const isSubtitleVisible = selectedScene.isSubtitleVisible !== false;
  const hasVisibleSceneHeading = (isTitleVisible && Boolean(selectedScene.title.trim())) || (isSubtitleVisible && Boolean(selectedScene.subtitle?.trim()));
  const selectedSceneIndex = draft.scenes.findIndex((scene) => scene.id === selectedScene.id);
  const selectedChapterLabel = `CHAPTER ${String(selectedSceneIndex + 1).padStart(2, "0")}`;
  const chapterEvidence = draft.chapterEvidence?.[selectedScene.id] ?? [];
  const isAdditionalEvidenceEnabled = draft.chapterEvidenceEnabled?.[selectedScene.id] === true;
  const endingMode = selectedScene.endingMode ?? "none";
  const endingConfig = selectedScene.endingConfig ?? {};
  const previewSubmissionDuration = Math.min(5, Math.max(1, Number(endingConfig.submissionDuration ?? "3") || 3));
  const activePreviewEvidenceItem = previewEvidenceItems?.[previewEvidenceIndex] ?? null;
  const endingMessengerMessages = getEndingMessengerMessages(endingConfig);
  const totalEvidenceCount = Object.values(draft.chapterEvidence ?? {}).flat().length;
  const recommendedColors = toneColorRecommendations[draft.tone];
  const livePreviewStyle = {
    "--maker-preview-primary": isHexColor(draft.colors.primary) ? draft.colors.primary : recommendedColors.primary,
    "--maker-preview-secondary": isHexColor(draft.colors.secondary) ? draft.colors.secondary : recommendedColors.secondary,
    "--maker-preview-special": isHexColor(draft.colors.special) ? draft.colors.special : recommendedColors.special,
    "--maker-preview-text": isHexColor(draft.colors.text) ? draft.colors.text : recommendedColors.text,
    "--maker-preview-background": isHexColor(draft.colors.background) ? draft.colors.background : recommendedColors.background,
  } as CSSProperties;

  useEffect(() => {
    if (!isPreviewSubmissionOpen) return;
    const timer = window.setTimeout(() => setIsPreviewSubmissionComplete(true), previewSubmissionDuration * 1000);
    return () => window.clearTimeout(timer);
  }, [isPreviewSubmissionOpen, previewSubmissionDuration, selectedScene.id]);

  function chooseScene(scene: MakerScene) {
    setSelectedSceneId(scene.id);
    setPendingMechanicId(getMechanicIdForScene(scene));
    setIsPreviewSubmissionOpen(false);
    setIsPreviewSubmissionComplete(false);
    setPreviewEvidenceItems(null);
    setPreviewEvidenceIndex(0);
  }

  function openPreviewEvidenceModal(items: EvidenceModalItem[]) {
    setPreviewEvidenceIndex(0);
    setPreviewEvidenceItems(items);
  }

  function closePreviewEvidenceModal() {
    if (previewEvidenceItems && previewEvidenceIndex < previewEvidenceItems.length - 1) {
      setPreviewEvidenceIndex((current) => current + 1);
      return;
    }
    setPreviewEvidenceItems(null);
    setPreviewEvidenceIndex(0);
  }

  function updateScene(patch: Partial<MakerScene>) {
    setDraft((current) => ({ ...current, scenes: current.scenes.map((scene) => scene.id === selectedScene.id ? { ...scene, ...patch } : scene) }));
    setSavedAt(null);
  }

  function selectMechanic(mechanicId: GameMechanicId) {
    setPendingMechanicId(mechanicId);
  }

  function addMechanic() {
    updateScene({
      mechanicType: selectedMechanicId,
      mechanic: selectedMechanic.label,
      mechanicConfig: selectedMechanicId === appliedMechanicId
        ? selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)
        : { ...getDefaultMechanicConfig(selectedMechanicId), ...(selectedScene.mechanicConfig ?? {}) },
      duration: selectedMechanic.estimatedMinutes,
    });
  }

  function updateMechanicConfig(key: string, value: string) {
    updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), [key]: value } });
  }

  function updateGpsArrivalLocations(locations: GpsArrivalLocation[]) {
    const firstLocation = locations[0];
    updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig("gps-arrival")), gpsLocations: JSON.stringify(locations), placeName: firstLocation?.name ?? "", address: firstLocation?.address ?? "", latitude: firstLocation?.latitude ?? "", longitude: firstLocation?.longitude ?? "", radius: firstLocation?.radius ?? "" } });
  }

  function updateGpsArrivalLocation(locationId: string, patch: Partial<GpsArrivalLocation>) {
    updateGpsArrivalLocations(gpsArrivalLocations.map((location) => location.id === locationId ? { ...location, ...patch } : location));
  }

  function addGpsArrivalLocation() {
    if (gpsArrivalLocations.length >= 3) return;
    updateGpsArrivalLocations([...gpsArrivalLocations, { id: `gps-location-${Date.now()}`, name: "새 조사 지점", address: "", latitude: "37.550416", longitude: "127.073818", radius: "20", rewardType: "image" }]);
  }

  function addGpsArrivalRewardAsset(locationId: string, file: File) {
    const location = gpsArrivalLocations.find((item) => item.id === locationId);
    const rewardType = location?.rewardType ?? "image";
    const maximumSize = rewardType === "image" ? 500 * 1024 : 1024 * 1024;
    if (file.size > maximumSize) {
      window.alert(rewardType === "image" ? "증거물 이미지는 500KB 이하로 첨부해 주세요." : "증거물 3D 모델은 1MB 이하의 GLB 파일을 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateGpsArrivalLocation(locationId, { rewardAsset: reader.result, rewardAssetName: file.name });
    };
    reader.readAsDataURL(file);
  }

  function updateEndingConfig(key: string, value: string) {
    updateScene({ endingConfig: { ...endingConfig, [key]: value } });
  }

  function updateEndingMessengerMessages(messages: string[]) {
    updateScene({ endingConfig: { ...endingConfig, messengerMessage: messages[0] ?? "", messengerMessages: JSON.stringify(messages) } });
  }

  function addEndingMessengerImage(file: File) {
    if (file.size > 500 * 1024) {
      window.alert("메신저 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateScene({ endingConfig: { ...endingConfig, messengerImage: reader.result, messengerImageName: file.name } });
    };
    reader.readAsDataURL(file);
  }

  function updatePresentationContent(content: string) {
    updateScene({ presentation: { ...(selectedScene.presentation ?? {}), content } });
  }

  function selectPresentationTemplate(template: SceneTemplateId) {
    updateScene({
      template,
      mechanicType: appliedMechanicId,
      mechanic: appliedMechanic.label,
      mechanicConfig: selectedScene.mechanicConfig ?? getDefaultMechanicConfig(appliedMechanicId),
      duration: appliedMechanic.estimatedMinutes,
    });
  }

  function updateSceneContent(patch: Partial<typeof sceneContent>) {
    const nextContent = { ...sceneContent, ...patch };
    updateScene({ content: nextContent, contentBlocks: contentBlocks.map((block) => block.id === sceneContent.id ? nextContent : block), ...(patch.body !== undefined ? { body: patch.body } : {}) });
  }

  function selectContentFormat(format: "card" | "droplink" | "modal") {
    setPendingContentFormat(format);
    setPendingContentDraft(createPendingContentDraft(format));
    setEditingContentBlockId(null);
    setIsPendingMessengerPreviewOpen(false);
  }

  function updatePendingContent(patch: Partial<PendingContentDraft>) {
    setPendingContentDraft((current) => ({ ...current, ...patch }));
  }

  function updatePendingExtraMessage(index: number, message: string) {
    setPendingContentDraft((current) => ({ ...current, extraMessages: current.extraMessages.map((item, itemIndex) => itemIndex === index ? message : item) }));
  }

  function addPendingNpcImage(file: File) {
    if (file.size > 500 * 1024) {
      window.alert("NPC 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updatePendingContent({ npcImage: reader.result, npcImageName: file.name });
    };
    reader.readAsDataURL(file);
  }

  function addPendingMessengerImage(file: File) {
    if (file.size > 500 * 1024) {
      window.alert("메신저 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updatePendingContent({ messengerImage: reader.result, messengerImageName: file.name });
    };
    reader.readAsDataURL(file);
  }

  function addContentBlock(format: "card" | "droplink" | "modal", content = pendingContentDraft) {
    const blockData = { format, label: content.label, title: content.title, body: content.body, sender: content.sender, notification: content.notification, messages: [content.message, ...content.extraMessages], actionLabel: content.actionLabel, ...(format === "droplink" ? { messengerImage: content.messengerImage, messengerImageName: content.messengerImageName } : {}), ...(format === "modal" ? { modalType: content.modalType, modalProgress: content.modalProgress, npcImage: content.npcImage, npcImageName: content.npcImageName, npcPresentation: content.npcPresentation, npcTextSpeed: content.npcTextSpeed } : {}) };
    if (editingContentBlockId) {
      const currentBlock = contentBlocks.find((block) => block.id === editingContentBlockId);
      if (currentBlock) {
        const updatedBlock = { ...currentBlock, ...blockData };
        updateScene({ content: sceneContent.id === editingContentBlockId ? updatedBlock : selectedScene.content, contentBlocks: contentBlocks.map((block) => block.id === editingContentBlockId ? updatedBlock : block) });
        setSelectedContentBlockId(editingContentBlockId);
        return;
      }
    }
    const id = `content-${Date.now()}`;
    const block = { id, ...blockData };
    updateScene({ contentBlocks: [...contentBlocks, block], flowOrder: [...flowOrder, id] });
    setSelectedContentBlockId(id);
    setEditingContentBlockId(id);
  }

  function editContentBlock(block: typeof sceneContent) {
    const format = block.format === "text" ? "card" : block.format;
    setSelectedContentBlockId(block.id ?? null);
    setEditingContentBlockId(block.id ?? null);
    setPendingContentFormat(format);
    setPendingContentDraft({ label: block.label ?? "", title: block.title ?? (block.format === "text" ? block.label ?? "안내" : ""), body: block.body ?? "", sender: block.sender ?? "", notification: block.notification ?? "", message: block.messages?.[0] ?? "", extraMessages: block.messages?.slice(1) ?? [], actionLabel: block.actionLabel ?? "확인", modalType: block.modalType ?? "progress", modalProgress: block.modalProgress ?? 65, npcImage: block.npcImage ?? "", npcImageName: block.npcImageName ?? "", npcPresentation: block.npcPresentation ?? "face", npcTextSpeed: block.npcTextSpeed ?? "normal", messengerImage: block.messengerImage ?? "", messengerImageName: block.messengerImageName ?? "" });
    setIsPendingMessengerPreviewOpen(format === "droplink");
  }

  function removeContentBlock(id: string) {
    if (contentBlocks.length <= 1) return;
    const nextBlocks = contentBlocks.filter((block) => block.id !== id);
    updateScene({ contentBlocks: nextBlocks, flowOrder: flowOrder.filter((flowId) => flowId !== id) });
    setSelectedContentBlockId(nextBlocks[0]?.id ?? null);
  }

  function moveFlowBlock(targetId: string) {
    if (!draggedFlowId || draggedFlowId === targetId) return;
    const nextOrder = flowOrder.filter((id) => id !== draggedFlowId);
    nextOrder.splice(nextOrder.indexOf(targetId), 0, draggedFlowId);
    updateScene({ flowOrder: nextOrder });
    setDraggedFlowId(null);
  }

  function updateContentMessage(index: number, value: string) {
    const messages = [...contentMessages];
    messages[index] = value;
    updateSceneContent({ messages });
  }

  function playPresentation() {
    setIsPresentationPlaying(true);
    window.setTimeout(() => setIsPresentationPlaying(false), 1500);
  }

  function addEvidence(file: File) {
    if (file.size > 500 * 1024) {
      window.alert("증거물 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    if (totalEvidenceCount >= 5) {
      window.alert("이 초안에는 증거물을 최대 5개까지 첨부할 수 있어요.");
      return;
    }
    const chapter = selectedScene.id;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const evidence: ChapterEvidence = {
        id: `evidence-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "") || "새 증거물",
        imageUrl: reader.result,
      };
      setDraft((current) => ({
        ...current,
        chapterEvidence: {
          ...(current.chapterEvidence ?? {}),
          [chapter]: [...(current.chapterEvidence?.[chapter] ?? []), evidence],
        },
      }));
      setSavedAt(null);
    };
    reader.readAsDataURL(file);
  }

  function removeEvidence(evidenceId: string) {
    const chapter = selectedScene.id;
    setDraft((current) => ({
      ...current,
      chapterEvidence: {
        ...(current.chapterEvidence ?? {}),
        [chapter]: (current.chapterEvidence?.[chapter] ?? []).filter((evidence) => evidence.id !== evidenceId),
      },
    }));
    setSavedAt(null);
  }

  function setAdditionalEvidenceEnabled(enabled: boolean) {
    const chapter = selectedScene.id;
    setDraft((current) => ({
      ...current,
      chapterEvidenceEnabled: {
        ...(current.chapterEvidenceEnabled ?? {}),
        [chapter]: enabled,
      },
    }));
    setSavedAt(null);
  }

  function addScanReferenceImage(file: File) {
    if (file.size > 500 * 1024) {
      window.alert("인식 기준 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), scanReferenceImage: reader.result, scanReferenceImageName: file.name, arRecognitionImage: reader.result, arRecognitionImageName: file.name } });
    };
    reader.readAsDataURL(file);
  }

  function addArAsset(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), arAsset: reader.result, arAssetName: file.name } });
    };
    reader.readAsDataURL(file);
  }

  function updateOrderingCards(cards: OrderingCard[]) {
    updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), orderingCards: JSON.stringify(cards) } });
  }

  function addOrderingCardImage(cardId: string, file: File) {
    if (file.size > 500 * 1024) {
      window.alert("카드 이미지는 500KB 이하로 첨부해 주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateOrderingCards(orderingCards.map((card) => card.id === cardId ? { ...card, imageUrl: reader.result, name: file.name } : card));
    };
    reader.readAsDataURL(file);
  }

  function addOrderingCard() {
    if (orderingCards.length >= 5) return;
    const id = `card-${orderingCardSequenceRef.current}`;
    orderingCardSequenceRef.current += 1;
    updateOrderingCards([...orderingCards, { id }]);
  }

  function addScene(template: SceneTemplateId) {
    const templateInfo = sceneTemplates.find((item) => item.id === template)!;
    const mechanicId = defaultMechanicByTemplate[template];
    const mechanic = gameMechanics.find((item) => item.id === mechanicId)!;
    const scene: MakerScene = {
      id: `scene-${template}-${draft.scenes.map((item) => item.id).join("-").length}`,
      template,
      title: `${templateInfo.name} 장면`,
      subtitle: "",
      isTitleVisible: true,
      isSubtitleVisible: true,
      body: templateInfo.description,
      mechanic: mechanic.label,
      mechanicType: mechanicId,
      mechanicConfig: getDefaultMechanicConfig(mechanicId),
      duration: mechanic.estimatedMinutes,
    };
    setDraft((current) => ({ ...current, scenes: [...current.scenes, scene] }));
    chooseScene(scene);
    setSavedAt(null);
  }

  function moveScene(targetSceneId: string) {
    if (!draggedSceneId || draggedSceneId === targetSceneId) return;
    setDraft((current) => {
      const fromIndex = current.scenes.findIndex((scene) => scene.id === draggedSceneId);
      const toIndex = current.scenes.findIndex((scene) => scene.id === targetSceneId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const scenes = [...current.scenes];
      const [movedScene] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, movedScene);
      return { ...current, scenes };
    });
    setDraggedSceneId(null);
    setSavedAt(null);
  }

  function removeSelectedScene() {
    if (draft.scenes.length <= 1) return;
    const scenes = draft.scenes.filter((scene) => scene.id !== selectedScene.id);
    setDraft((current) => ({ ...current, scenes }));
    chooseScene(scenes[0]);
    setSavedAt(null);
  }

  function saveDraft() {
    saveMakerDraft(draft);
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }

  function loadGiraffeDraft() {
    if (!window.confirm("현재 이 기기에 저장된 초안을 기린 방탈출 기본 초안으로 바꿀까요?")) return;
    const nextDraft = cloneDefaultDraft();
    setDraft(nextDraft);
    setSelectedSceneId(nextDraft.scenes[0].id);
    setPendingMechanicId(getMechanicIdForScene(nextDraft.scenes[0]));
    setSelectedContentBlockId(null);
    saveMakerDraft(nextDraft);
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }

  function openPlaytest() {
    saveMakerDraft(draft);
    router.push("/maker/playtest");
  }

  function renderContentBlockPreview(block: typeof sceneContent) {
    const messages = block.messages?.length ? block.messages : [block.body || ""];
    return <div className={`maker-content-preview maker-preview-content-screen is-${block.format}`}>
      {block.format === "text" && <div className="maker-content-preview-text"><span>{block.label || "안내"}</span><p>{block.body || "플레이어에게 전달할 내용을 입력하세요."}</p></div>}
      {block.format === "card" && <div className="maker-content-preview-card"><span>{block.label || "정보 카드"}</span><strong>{block.title || "카드 제목"}</strong><p>{block.body || "카드 내용을 입력하세요."}</p></div>}
      {block.format === "droplink" && <div className={`maker-content-preview-droplink ${openedMessengerBlockId === block.id ? "is-open" : ""}`}><button className="maker-messenger-popup" type="button" onClick={() => setOpenedMessengerBlockId(block.id ?? null)}><span>{block.sender || "DROPLINK"}</span><strong>{block.notification || "새로운 메시지가 도착했습니다."}</strong><em>지금</em></button>{openedMessengerBlockId === block.id && <section className="maker-messenger-conversation">{messages.map((message, index) => <p key={`${block.id}-live-message-${index}`}>{message || "대화 내용을 입력하세요."}</p>)}<button type="button">{block.actionLabel || "확인"}</button></section>}</div>}
      {block.format === "modal" && <div className={`maker-content-preview-modal is-${block.modalType ?? "progress"}`}>{block.modalType === "npc" ? <><div className="maker-modal-npc-heading">{block.npcImage ? <Image src={block.npcImage} alt="NPC" width={42} height={42} unoptimized /> : <i>NPC</i>}<span>{block.sender || "NPC"}</span><em>대화</em></div><section>{messages.map((message, index) => <p key={`${block.id}-npc-message-${index}`}>{message || "NPC의 대사를 입력하세요."}</p>)}</section></> : <><span>{block.label || "진행 상태"}</span><strong>{block.title || "조사 기록을 분석하고 있습니다"}</strong><p>{block.body || "조금만 기다려 주세요."}</p><div className="maker-modal-progress"><i style={{ width: `${Math.min(100, Math.max(0, block.modalProgress ?? 65))}%` }} /><b>{Math.min(100, Math.max(0, block.modalProgress ?? 65))}%</b></div></>}<button type="button">{block.actionLabel || "확인"}</button></div>}
    </div>;
  }

  function renderMechanicPreview() {
    if (appliedMechanicId === "none") return null;
    const isGps = appliedMechanic.category === "gps";
    const isAr = appliedMechanic.category === "ar";
    const isTextAnswer = appliedMechanicId === "text-answer";
    const arLabel = getArActionLabel(appliedMechanicId, selectedScene.mechanicConfig);
    const mechanicEvidence = getMechanicEvidence(selectedScene);
    return <article className={`maker-preview-flow-item is-mechanic ${isGps ? "is-gps" : ""} ${isAr ? "is-ar" : ""} ${draggedFlowId === "mechanic" ? "is-dragging" : ""}`} draggable onDragStart={() => setDraggedFlowId("mechanic")} onDragEnd={() => setDraggedFlowId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveFlowBlock("mechanic")}>
      {isAr ? <><LiveGpsMap latitude={selectedScene.mechanicConfig?.arLatitude ?? "37.550416"} longitude={selectedScene.mechanicConfig?.arLongitude ?? "127.073818"} placeName={selectedScene.mechanicConfig?.arPlaceName ?? "AR 조사 지점"} /><button className="maker-preview-ar-button" type="button" disabled>{arLabel}</button><small className="maker-preview-ar-notice">현장 도착 후 활성화</small><i className="maker-preview-flow-drag" aria-label="드래그하여 순서 변경">⠿</i></> : isGps ? <><div className={mechanicEvidence.length ? "maker-preview-gps-evidence-trigger" : ""} onClick={() => mechanicEvidence.length && openPreviewEvidenceModal(mechanicEvidence)}><LiveGpsMap latitude={selectedScene.mechanicConfig?.latitude ?? selectedScene.mechanicConfig?.startLatitude ?? "37.550416"} longitude={selectedScene.mechanicConfig?.longitude ?? selectedScene.mechanicConfig?.startLongitude ?? "127.073818"} placeName={selectedScene.mechanicConfig?.placeName ?? selectedScene.mechanicConfig?.startName ?? "현장 이름"} /></div><i className="maker-preview-flow-drag" aria-label="드래그하여 순서 변경">⠿</i></> : <><span>기믹</span><strong>{appliedMechanic.label}</strong><small>{appliedMechanic.description}</small>{isTextAnswer && <div className="maker-preview-text-answer"><p>{selectedScene.mechanicConfig?.question || "정답을 입력하세요."}</p><input readOnly placeholder={selectedScene.mechanicConfig?.inputPlaceholder || "정답을 입력하세요"} /><button type="button">{selectedScene.mechanicConfig?.actionLabel || "확인"}</button></div>}{appliedMechanicId === "card-ordering" && <div className="maker-preview-ordering-cards">{orderingCards.map((card, index) => <span key={card.id}>{card.imageUrl ? <Image src={card.imageUrl} alt={`${index + 1}번 카드`} width={34} height={34} unoptimized /> : String(index + 1)}</span>)}</div>}<i>⠿</i></>}
    </article>;
  }

  return (
    <main className="maker-app">
      <header className="maker-topbar">
        <Link className="maker-brand" href="/maker/identity"><Image src="/campusdrop_logo.png" alt="Campus Drop" width={36} height={36} priority unoptimized /><span>Maker</span></Link>
        <nav className="maker-step-nav" aria-label="Maker 단계"><Link href="/maker/identity">1. Game identity</Link><strong>2. Chapters</strong><span>3. Playtest</span></nav>
        <div className="maker-topbar-actions"><span>{savedAt ? `${savedAt}에 이 기기에 저장됨` : "이 기기의 초안을 편집 중"}</span><button className="maker-secondary-button" type="button" onClick={loadGiraffeDraft}>기린 기본 초안 불러오기</button><button className="maker-secondary-button" type="button" onClick={saveDraft}>초안 저장</button><button className="maker-primary-button" type="button" onClick={openPlaytest}>게임 체험하기</button></div>
      </header>

      <section className="maker-workspace">
        <aside className="maker-outline" aria-label="게임 장면 목록">
          <div className="maker-outline-heading"><p>GAME FLOW</p><h1>{draft.title}</h1></div>
          <div className="maker-scene-list">
            {draft.scenes.map((scene, index) => {
              return <button className={`maker-scene-item ${scene.id === selectedScene.id ? "is-selected" : ""} ${scene.id === draggedSceneId ? "is-dragging" : ""}`} key={scene.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDraggedSceneId(scene.id); }} onDragEnd={() => setDraggedSceneId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveScene(scene.id)} onClick={() => chooseScene(scene)}><b>{String(index + 1).padStart(2, "0")}</b><span>CHAPTER {String(index + 1).padStart(2, "0")}</span><strong>{scene.title}</strong><i className="maker-drag-handle" aria-hidden="true">⠿</i></button>;
            })}
          </div>
          <details className="maker-add-scene"><summary>+ 장면 추가</summary><div>{sceneTemplates.map((template) => <button key={template.id} type="button" onClick={() => addScene(template.id)}>{template.name}</button>)}</div></details>
        </aside>

        <section className="maker-editor" aria-label="챕터 설정 편집">
          <div className="maker-scene-editor-heading"><div><p>{selectedChapterLabel}</p><div className="maker-scene-title-fields"><label className="maker-scene-title-input"><span>장면 제목 <i>필수</i></span><input required aria-required="true" value={selectedScene.title} onChange={(event) => updateScene({ title: event.target.value })} /></label><label className="maker-scene-subtitle-input"><span>소제목</span><input value={selectedScene.subtitle ?? ""} placeholder="장면을 설명하는 짧은 문구" onChange={(event) => updateScene({ subtitle: event.target.value })} /></label><div className="maker-scene-visibility" role="group" aria-label="적용 화면 제목 표시 설정"><span>적용 화면 표시</span><button className={isTitleVisible ? "is-selected" : ""} type="button" aria-pressed={isTitleVisible} onClick={() => updateScene({ isTitleVisible: !isTitleVisible })}>장면 제목</button><button className={isSubtitleVisible ? "is-selected" : ""} type="button" aria-pressed={isSubtitleVisible} onClick={() => updateScene({ isSubtitleVisible: !isSubtitleVisible })}>소제목</button></div></div></div><button className="maker-danger-button" type="button" disabled={draft.scenes.length <= 1} onClick={removeSelectedScene}>장면 삭제</button></div>
          <section className="maker-content-editor" style={livePreviewStyle} aria-labelledby="content-title">
            <div className="maker-content-heading"><div><span>내용 블록</span><h3 id="content-title">기믹 뒤에 전달할 내용을 추가하세요.</h3><p>내용은 여러 개를 추가할 수 있고, 실제 순서는 오른쪽 미리보기에서 바꿉니다.</p></div></div>
            <div className="maker-content-format-picker" role="group" aria-label="내용 블록 추가">
              <button className={pendingContentFormat === "card" ? "is-selected" : ""} type="button" onClick={() => selectContentFormat("card")}><strong>정보 카드</strong><small>제목과 설명을 한 장으로</small></button>
              <button className={pendingContentFormat === "droplink" ? "is-selected" : ""} type="button" onClick={() => selectContentFormat("droplink")}><strong>메신저 대화</strong><small>메시지로 이어지는 대화</small></button>
              <button className={pendingContentFormat === "modal" ? "is-selected" : ""} type="button" onClick={() => selectContentFormat("modal")}><strong>NPC 대화</strong><small>NPC가 건네는 대화창</small></button>
            </div>
            <section className={`maker-content-add-config is-${pendingContentFormat}`} aria-label={`새 ${pendingContentFormat === "card" ? "정보 카드" : pendingContentFormat === "droplink" ? "대화" : "모달"} 구성`}><div className="maker-content-add-config-heading"><div><span>새 {pendingContentFormat === "card" ? "정보 카드" : pendingContentFormat === "droplink" ? "대화" : "모달"}</span><strong>{pendingContentFormat === "card" ? "카드에 보여줄 정보를 입력하세요." : pendingContentFormat === "droplink" ? "플레이어에게 전달할 대화를 입력하세요." : "모달 유형과 내용을 먼저 구성하세요."}</strong></div><button className="maker-content-add" type="button" onClick={() => addContentBlock(pendingContentFormat)}>추가하기</button></div>{pendingContentFormat === "card" && <div className="maker-content-add-config-fields"><label><span>카드 상단 라벨</span><input value={pendingContentDraft.label} placeholder="예: 사건 개요" onChange={(event) => updatePendingContent({ label: event.target.value })} /></label><label><span>카드 제목</span><input value={pendingContentDraft.title} placeholder="예: 현장 조사 지시" onChange={(event) => updatePendingContent({ title: event.target.value })} /></label><label className="maker-content-add-wide"><span>카드 내용</span><textarea rows={3} value={pendingContentDraft.body} placeholder="플레이어에게 보여줄 내용을 입력하세요." onChange={(event) => updatePendingContent({ body: event.target.value })} /></label></div>}{pendingContentFormat === "droplink" && <div className="maker-content-add-config-fields"><label><span>발신자</span><input value={pendingContentDraft.sender} onChange={(event) => updatePendingContent({ sender: event.target.value })} /></label><label><span>알림 문구</span><input value={pendingContentDraft.notification} placeholder="새로운 메시지가 도착했습니다." onChange={(event) => updatePendingContent({ notification: event.target.value })} /></label><label className="maker-content-add-wide"><span>대화 내용</span><textarea rows={3} value={pendingContentDraft.message} placeholder="플레이어에게 전달할 대화" onChange={(event) => updatePendingContent({ message: event.target.value })} /></label></div>}{pendingContentFormat === "modal" && <div className="maker-content-add-config-fields"><label><span>모달 유형</span><select value={pendingContentDraft.modalType} onChange={(event) => updatePendingContent({ modalType: event.target.value as "progress" | "npc" })}><option value="progress">진행 상태 바</option><option value="npc">NPC 대화창</option></select></label>{pendingContentDraft.modalType === "progress" ? <><label><span>진행률</span><input type="number" min="0" max="100" value={pendingContentDraft.modalProgress} onChange={(event) => updatePendingContent({ modalProgress: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} /></label><label><span>모달 제목</span><input value={pendingContentDraft.title} placeholder="예: 기록을 분석하고 있습니다" onChange={(event) => updatePendingContent({ title: event.target.value })} /></label><label className="maker-content-add-wide"><span>안내 내용</span><textarea rows={3} value={pendingContentDraft.body} placeholder="조금만 기다려 주세요." onChange={(event) => updatePendingContent({ body: event.target.value })} /></label></> : <><label><span>NPC 이름</span><input value={pendingContentDraft.sender} onChange={(event) => updatePendingContent({ sender: event.target.value })} /></label><label><span>대화 연출</span><select value={pendingContentDraft.npcPresentation} onChange={(event) => updatePendingContent({ npcPresentation: event.target.value as PendingContentDraft["npcPresentation"] })}><option value="face">대면 대화</option><option value="radio">무전</option><option value="record">기록 낭독</option></select></label><label><span>텍스트 속도</span><select value={pendingContentDraft.npcTextSpeed} onChange={(event) => updatePendingContent({ npcTextSpeed: event.target.value as PendingContentDraft["npcTextSpeed"] })}><option value="normal">보통</option><option value="fast">빠름</option><option value="instant">즉시</option></select></label><label className="maker-content-add-wide"><span>NPC 대사</span><textarea rows={3} value={pendingContentDraft.message} placeholder="NPC의 대사" onChange={(event) => updatePendingContent({ message: event.target.value })} /></label></>}</div>}</section>
            {pendingContentFormat === "droplink" && <section className="maker-messenger-asset" aria-label="메신저 상단 이미지"><div><span>상단 사각형 이미지</span><small>기본 DROPLINK 대신 사용할 이미지를 첨부할 수 있습니다.</small></div>{pendingContentDraft.messengerImage ? <div className="maker-messenger-asset-selected"><Image src={pendingContentDraft.messengerImage} alt="메신저 상단 이미지 미리보기" width={58} height={58} unoptimized /><div><strong>{pendingContentDraft.messengerImageName || "메신저 이미지"}</strong><label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addPendingMessengerImage(file); event.target.value = ""; }} /><span>이미지 교체</span></label><button type="button" onClick={() => updatePendingContent({ messengerImage: "", messengerImageName: "" })}>기본 DROPLINK 사용</button></div></div> : <label className="maker-messenger-asset-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addPendingMessengerImage(file); event.target.value = ""; }} /><span>+ 이미지 첨부</span></label>}</section>}
            <section className={`maker-content-add-preview is-${pendingContentFormat}`} aria-label="내용 미리보기"><span>내용 미리보기</span><div>{pendingContentFormat === "card" && <article className="maker-content-add-preview-card"><small>{pendingContentDraft.label || "안내"}</small><strong>{pendingContentDraft.title || "카드 제목"}</strong><p>{pendingContentDraft.body || "카드 내용을 입력하세요."}</p></article>}{pendingContentFormat === "droplink" && <article className={`maker-content-add-preview-messenger ${isPendingMessengerPreviewOpen ? "is-open" : ""}`}><button type="button" onClick={() => setIsPendingMessengerPreviewOpen(true)}><span>{pendingContentDraft.sender || "DROPLINK"}</span><em>화면 진입 2초 후</em><strong>{pendingContentDraft.notification || "새로운 메시지가 도착했습니다."}</strong></button>{isPendingMessengerPreviewOpen && <section><p>{pendingContentDraft.message || "대화 내용을 입력하세요."}</p></section>}</article>}{pendingContentFormat === "modal" && <article className={`maker-content-add-preview-modal is-${pendingContentDraft.modalType}`}>{pendingContentDraft.modalType === "npc" ? <><small>{pendingContentDraft.sender || "NPC"}</small><p>{pendingContentDraft.message || "NPC의 대사를 입력하세요."}</p></> : <><small>{pendingContentDraft.label || "진행 상태"}</small><strong>{pendingContentDraft.title || "기록을 분석하고 있습니다"}</strong><p>{pendingContentDraft.body || "조금만 기다려 주세요."}</p><div><i style={{ width: `${pendingContentDraft.modalProgress}%` }} /><b>{pendingContentDraft.modalProgress}%</b></div></>}<button type="button">{pendingContentDraft.actionLabel || "확인"}</button></article>}</div></section>
            {pendingContentFormat === "modal" && pendingContentDraft.modalType === "npc" && <section className="maker-npc-asset" aria-label="NPC 이미지"><div><span>NPC 이미지</span><small>대화를 건네는 인물의 이미지를 첨부하세요.</small></div>{pendingContentDraft.npcImage ? <div className="maker-npc-asset-selected"><Image src={pendingContentDraft.npcImage} alt="NPC 이미지 미리보기" width={72} height={72} unoptimized /><div><strong>{pendingContentDraft.npcImageName || "NPC 이미지"}</strong><label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addPendingNpcImage(file); event.target.value = ""; }} /><span>이미지 교체</span></label><button type="button" onClick={() => updatePendingContent({ npcImage: "", npcImageName: "" })}>삭제</button></div></div> : <label className="maker-npc-asset-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addPendingNpcImage(file); event.target.value = ""; }} /><span>+ NPC 이미지 첨부</span></label>}</section>}
            {(pendingContentFormat === "droplink" || (pendingContentFormat === "modal" && pendingContentDraft.modalType === "npc")) && <section className="maker-pending-message-list" aria-label="대화 내용"><div><span>{pendingContentFormat === "modal" ? "NPC 대화 내용" : "대화 내용"}</span><small>대화를 계속 추가할 수 있습니다.</small></div>{pendingContentDraft.extraMessages.map((message, index) => <label key={`pending-message-${index}`}><span>{String(index + 2).padStart(2, "0")}</span><textarea rows={2} value={message} placeholder="대화 내용" onChange={(event) => updatePendingExtraMessage(index, event.target.value)} /><button type="button" onClick={() => updatePendingContent({ extraMessages: pendingContentDraft.extraMessages.filter((_, messageIndex) => messageIndex !== index) })}>삭제</button></label>)}<button className="maker-add-content-message" type="button" onClick={() => updatePendingContent({ extraMessages: [...pendingContentDraft.extraMessages, ""] })}>+ 대화 추가</button></section>}
            <div className="maker-content-block-list" aria-label="추가된 내용 블록">{contentBlocks.map((block, index) => <button className={block.id === sceneContent.id ? "is-selected" : ""} key={block.id} type="button" onClick={() => editContentBlock(block)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{block.format === "text" ? "브리핑" : block.format === "card" ? "정보 카드" : block.format === "modal" ? "NPC 대화" : "메신저 대화"}</strong>{contentBlocks.length > 1 && <i onClick={(event) => { event.stopPropagation(); removeContentBlock(block.id!); }}>삭제</i>}</button>)}</div>
            <div className="maker-content-layout">
              <div className="maker-content-fields">
                {sceneContent.format === "modal" && <><label><span>모달 유형</span><select value={sceneContent.modalType ?? "progress"} onChange={(event) => updateSceneContent({ modalType: event.target.value as "progress" | "npc" })}><option value="progress">진행 상태 바</option><option value="npc">NPC 대화창</option></select></label>{(sceneContent.modalType ?? "progress") === "progress" ? <><label><span>모달 제목</span><input value={sceneContent.title ?? ""} placeholder="예: 기록을 분석하고 있습니다" onChange={(event) => updateSceneContent({ title: event.target.value })} /></label><label><span>진행률</span><input type="number" min="0" max="100" value={sceneContent.modalProgress ?? 65} onChange={(event) => updateSceneContent({ modalProgress: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} /></label></> : <><label><span>NPC 이름</span><input value={sceneContent.sender ?? "NPC"} onChange={(event) => updateSceneContent({ sender: event.target.value })} /></label><div className="maker-content-message-list"><span>NPC 대사</span>{contentMessages.map((message, index) => <label key={`${selectedScene.id}-npc-message-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><textarea rows={2} value={message} placeholder="NPC의 대사" onChange={(event) => updateContentMessage(index, event.target.value)} />{contentMessages.length > 1 && <button type="button" onClick={() => updateSceneContent({ messages: contentMessages.filter((_, messageIndex) => messageIndex !== index) })}>삭제</button>}</label>)}<button className="maker-add-content-message" type="button" onClick={() => updateSceneContent({ messages: [...contentMessages, ""] })}>+ 대사 추가</button></div></>}</>}
                {sceneContent.format === "modal" && sceneContent.modalType === "npc" && <><label><span>대화 연출</span><select value={sceneContent.npcPresentation ?? "face"} onChange={(event) => updateSceneContent({ npcPresentation: event.target.value as "face" | "radio" | "record" })}><option value="face">대면 대화</option><option value="radio">무전</option><option value="record">기록 낭독</option></select></label><label><span>텍스트 속도</span><select value={sceneContent.npcTextSpeed ?? "normal"} onChange={(event) => updateSceneContent({ npcTextSpeed: event.target.value as "normal" | "fast" | "instant" })}><option value="normal">보통</option><option value="fast">빠름</option><option value="instant">즉시</option></select></label></>}
                {sceneContent.format !== "droplink" && sceneContent.modalType !== "npc" && <><label><span>{sceneContent.format === "card" ? "카드 상단 라벨" : "안내 라벨"}</span><input value={sceneContent.label ?? ""} placeholder="예: 사건 개요" onChange={(event) => updateSceneContent({ label: event.target.value })} /></label>{sceneContent.format === "card" && <label><span>카드 제목</span><input value={sceneContent.title ?? ""} placeholder="예: 현장 조사 지시" onChange={(event) => updateSceneContent({ title: event.target.value })} /></label>}<label className="maker-content-body-field"><span>{sceneContent.format === "card" ? "카드 내용" : "내용"}</span><textarea rows={4} value={sceneContent.body ?? ""} placeholder="플레이어에게 보여줄 내용을 입력하세요." onChange={(event) => updateSceneContent({ body: event.target.value })} /></label></>}
                {sceneContent.format === "droplink" && <><label><span>발신자</span><input value={sceneContent.sender ?? "DROPLINK"} onChange={(event) => updateSceneContent({ sender: event.target.value })} /></label><label className="maker-content-body-field"><span>수신 알림 문구</span><input value={sceneContent.notification ?? ""} placeholder="예: 증거물 분석 결과가 도착했습니다." onChange={(event) => updateSceneContent({ notification: event.target.value })} /></label><div className="maker-content-message-list"><span>대화 내용</span>{contentMessages.map((message, index) => <label key={`${selectedScene.id}-message-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><textarea rows={2} value={message} placeholder="대화 한 줄" onChange={(event) => updateContentMessage(index, event.target.value)} />{contentMessages.length > 1 && <button type="button" onClick={() => updateSceneContent({ messages: contentMessages.filter((_, messageIndex) => messageIndex !== index) })}>삭제</button>}</label>)}<button className="maker-add-content-message" type="button" onClick={() => updateSceneContent({ messages: [...contentMessages, ""] })}>+ 대화 추가</button></div></>}
                <label><span>진행 버튼</span><input value={sceneContent.actionLabel ?? "확인"} placeholder="예: 조사 시작" onChange={(event) => updateSceneContent({ actionLabel: event.target.value })} /></label>
              </div>
              <div className={`maker-content-preview is-${sceneContent.format}`} style={livePreviewStyle} aria-label="내용 구성 미리보기">
                {sceneContent.format === "text" && <div className="maker-content-preview-text"><span>{sceneContent.label || "안내"}</span><p>{sceneContent.body || "플레이어에게 전달할 내용을 입력하세요."}</p></div>}
                {sceneContent.format === "card" && <div className="maker-content-preview-card"><span>{sceneContent.label || "정보 카드"}</span><strong>{sceneContent.title || "카드 제목"}</strong><p>{sceneContent.body || "카드 내용을 입력하세요."}</p></div>}
                {sceneContent.format === "droplink" && <div className="maker-content-preview-droplink"><div><span>{sceneContent.sender || "DROPLINK"}</span><em>지금</em></div><strong>{sceneContent.notification || "새로운 메시지가 도착했습니다."}</strong><section>{contentMessages.map((message, index) => <p key={`${selectedScene.id}-preview-message-${index}`}>{message || "대화 내용을 입력하세요."}</p>)}</section><button type="button">{sceneContent.actionLabel || "확인"}</button></div>}
                {sceneContent.format === "modal" && <div className={`maker-content-preview-modal is-${sceneContent.modalType ?? "progress"}`}>{(sceneContent.modalType ?? "progress") === "npc" ? <><div className="maker-modal-npc-heading"><span>{sceneContent.sender || "NPC"}</span><em>대화</em></div><section>{contentMessages.map((message, index) => <p key={`${selectedScene.id}-preview-npc-message-${index}`}>{message || "NPC의 대사를 입력하세요."}</p>)}</section></> : <><span>{sceneContent.label || "진행 상태"}</span><strong>{sceneContent.title || "조사 기록을 분석하고 있습니다"}</strong><p>{sceneContent.body || "조금만 기다려 주세요."}</p><div className="maker-modal-progress"><i style={{ width: `${Math.min(100, Math.max(0, sceneContent.modalProgress ?? 65))}%` }} /><b>{Math.min(100, Math.max(0, sceneContent.modalProgress ?? 65))}%</b></div></>}<button type="button">{sceneContent.actionLabel || "확인"}</button></div>}
              </div>
            </div>
          </section>
          <section className={`maker-presentation-editor is-${selectedTemplate.id} ${isPresentationEditorOpen ? "" : "is-collapsed"}`} style={livePreviewStyle} aria-labelledby="presentation-title">
            <div className="maker-presentation-heading"><div><div className="maker-editor-kicker">TRANSITION ANIMATION</div><h3 id="presentation-title">{isPresentationEditorOpen ? "애니메이션을 설정하세요." : `${selectedTemplate.name} 연출 적용됨`}</h3><p>{isPresentationEditorOpen ? "연출에 잠깐 나타날 내용을 입력하세요. 재생이 끝나면 기본 게임 화면으로 돌아갑니다." : "필요하면 다시 열어 연출을 수정할 수 있습니다."}</p></div><div className="maker-presentation-actions">{isPresentationEditorOpen ? <><button className={`maker-presentation-preview-button ${isPresentationPlaying ? "is-playing" : ""}`} type="button" onClick={playPresentation}><i aria-hidden="true">▶</i>{isPresentationPlaying ? "재생 중" : "애니메이션 미리보기"}</button><button className="maker-presentation-apply" type="button" onClick={() => setIsPresentationEditorOpen(false)}>적용</button></> : <button className="maker-presentation-reopen" type="button" onClick={() => setIsPresentationEditorOpen(true)}>연출 수정</button>}</div></div>
            {isPresentationEditorOpen && <><div className="maker-template-picker" aria-label="전환 애니메이션 템플릿">
              {sceneTemplates.map((template) => <button className={selectedScene.template === template.id ? "is-selected" : ""} key={template.id} type="button" onClick={() => selectPresentationTemplate(template.id)}><b>{template.symbol}</b><strong>{template.name}</strong><span>{template.description}</span></button>)}
            </div>
            <div className="maker-presentation-layout"><div className="maker-presentation-fields"><label className="maker-wide-field"><span>내용</span><input value={presentationContent} placeholder="연출에서 잠깐 보여줄 문구" onChange={(event) => updatePresentationContent(event.target.value)} /></label></div><div className={`maker-presentation-preview is-${selectedTemplate.id} ${isPresentationPlaying && selectedTemplate.id !== "none" ? "is-playing" : ""} ${selectedTemplate.id === "none" ? "is-static" : ""}`}><div className="maker-presentation-copy"><h4>{presentationContent || "연출 내용"}</h4></div></div></div></>}
          </section>
          <div className="maker-scene-fields">
            <section className={`maker-mechanic-panel ${isMechanicEditorOpen ? "" : "is-collapsed"}`} aria-labelledby="mechanic-panel-title"><div className="maker-mechanic-panel-heading"><div><span>플레이 방식</span><h3 id="mechanic-panel-title">{isMechanicEditorOpen ? "이 챕터의 기믹을 고르세요." : `${appliedMechanic.label} 적용됨`}</h3><p>{isMechanicEditorOpen ? "기믹을 고른 뒤 적용을 누르면 적용 화면에 반영됩니다." : "필요하면 다시 열어 기믹을 수정할 수 있습니다."}</p></div>{isMechanicEditorOpen ? <button className="maker-mechanic-apply" type="button" onClick={() => { addMechanic(); setIsMechanicEditorOpen(false); }}>적용</button> : <button className="maker-mechanic-reopen" type="button" onClick={() => setIsMechanicEditorOpen(true)}>기믹 수정</button>}</div>{isMechanicEditorOpen && <>
            <section className="maker-mechanic-editor maker-wide-field" aria-labelledby="mechanic-title"><div className="maker-mechanic-heading"><div><span>플레이 방식</span><h3 id="mechanic-title">이 챕터의 기믹을 고르세요.</h3><p>선택한 기믹에 필요한 정보만 설정할 수 있습니다.</p></div><b>{selectedMechanic.capability} · 예상 {selectedMechanic.estimatedMinutes}분</b></div><div className="maker-mechanic-groups">{gameMechanicCategories.map((category) => <section className="maker-mechanic-group" key={category.id}><div><strong>{category.label}</strong><span>{category.description}</span></div><div className="maker-mechanic-picker">{gameMechanics.filter((mechanic) => mechanic.category === category.id).map((mechanic) => <button className={selectedMechanicId === mechanic.id ? "is-selected" : ""} key={mechanic.id} type="button" onClick={() => selectMechanic(mechanic.id)}><strong>{mechanic.label}</strong><small>{mechanic.description} · {mechanic.estimatedMinutes}분</small></button>)}</div></section>)}</div><div className="maker-mechanic-config"><div><span>{selectedMechanic.label} 설정</span><small>{selectedMechanic.capability} · 예상 {selectedMechanic.estimatedMinutes}분</small></div><div className="maker-mechanic-config-fields">{selectedMechanic.configFields.map((field) => <label key={field.key}><span>{field.label}</span>{field.input === "select" ? <select value={selectedScene.mechanicConfig?.[field.key] ?? field.defaultValue ?? ""} onChange={(event) => updateMechanicConfig(field.key, event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <div className="maker-mechanic-input"><input type={field.input} min={field.input === "number" && !field.key.toLowerCase().includes("latitude") && !field.key.toLowerCase().includes("longitude") ? "1" : undefined} step={field.key.toLowerCase().includes("latitude") || field.key.toLowerCase().includes("longitude") ? "0.000001" : undefined} value={selectedScene.mechanicConfig?.[field.key] ?? field.defaultValue ?? ""} onChange={(event) => updateMechanicConfig(field.key, event.target.value)} />{field.suffix && <b>{field.suffix}</b>}</div>}<small>{field.description}</small></label>)}</div>{selectedMechanicId === "gps-arrival" && <LocationPicker title="현장 위치" guide="핀을 누르면 위도와 경도가 자동으로 입력됩니다. 실제 게임은 이 좌표와 도착 반경을 기기 GPS와 비교해 현장 도착 여부를 판정합니다." latitude={selectedScene.mechanicConfig?.latitude ?? "37.550416"} longitude={selectedScene.mechanicConfig?.longitude ?? "127.073818"} placeName={selectedScene.mechanicConfig?.placeName ?? "현장 위치"} address={selectedScene.mechanicConfig?.address ?? ""} onLocationChange={(latitude, longitude) => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), latitude, longitude } })} />}{selectedMechanicId === "direction-tracking" && <LocationPicker title="방향 추적 시작 위치" guide="핀을 누르면 시작 위치의 위도와 경도가 자동으로 입력됩니다. 플레이어는 시작 인정 반경 안에서 선택한 출발 방향을 따라 이동합니다." latitude={selectedScene.mechanicConfig?.startLatitude ?? "37.550416"} longitude={selectedScene.mechanicConfig?.startLongitude ?? "127.073818"} placeName={selectedScene.mechanicConfig?.startName ?? "시작 위치"} address={selectedScene.mechanicConfig?.startAddress ?? ""} onLocationChange={(startLatitude, startLongitude) => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), startLatitude, startLongitude } })} />}{selectedMechanicId === "image-scan" && <section className="maker-scan-reference" aria-label="인식 기준 이미지"><div><span>인식 기준 이미지 <i>필수</i></span><small>플레이어가 카메라로 찾아야 할 실제 이미지 또는 표식을 첨부하세요.</small></div>{selectedScene.mechanicConfig?.scanReferenceImage ? <div className="maker-scan-reference-selected"><Image src={selectedScene.mechanicConfig.scanReferenceImage} alt="인식 기준 이미지 미리보기" width={180} height={120} unoptimized /><div><strong>{selectedScene.mechanicConfig.scanReferenceImageName || "인식 기준 이미지"}</strong><label className="maker-scan-reference-replace"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addScanReferenceImage(file); event.target.value = ""; }} /><span>이미지 교체</span></label><button type="button" onClick={() => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? {}), scanReferenceImage: "", scanReferenceImageName: "" } })}>삭제</button></div></div> : <label className="maker-scan-reference-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addScanReferenceImage(file); event.target.value = ""; }} /><span>+ 인식 기준 이미지 첨부</span></label>}<p>이미지당 500KB 이하로 첨부해 주세요.</p></section>}{["ar-clue", "ar-assembly"].includes(selectedMechanicId) && <section className="maker-ar-asset" aria-label="AR 표시 자산"><div><span>AR 표시 자산 <i>필수</i></span><small>{(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? "현실 공간에 띄울 2D 이미지를 첨부하세요." : "현실 공간에 띄울 GLB 3D 모델을 첨부하세요."}</small></div>{selectedScene.mechanicConfig?.arAsset ? <div className="maker-ar-asset-selected">{(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? <Image src={selectedScene.mechanicConfig.arAsset} alt="AR 표시 자산 미리보기" width={180} height={120} unoptimized /> : <b>GLB</b>}<div><strong>{selectedScene.mechanicConfig.arAssetName || "AR 표시 자산"}</strong><label className="maker-scan-reference-replace"><input type="file" accept={(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? "image/*" : ".glb,model/gltf-binary"} onChange={(event) => { const file = event.target.files?.[0]; if (file) addArAsset(file); event.target.value = ""; }} /><span>자산 교체</span></label><button type="button" onClick={() => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? {}), arAsset: "", arAssetName: "" } })}>삭제</button></div></div> : <label className="maker-scan-reference-upload"><input type="file" accept={(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? "image/*" : ".glb,model/gltf-binary"} onChange={(event) => { const file = event.target.files?.[0]; if (file) addArAsset(file); event.target.value = ""; }} /><span>+ {(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? "AR 이미지" : "GLB 모델"} 첨부</span></label>}<p>{(selectedScene.mechanicConfig?.assetType ?? "model") === "image" ? "이미지당 500KB 이하" : "GLB 모델당 1MB 이하"}로 첨부해 주세요.</p></section>}</div></section>
            {isMechanicEditorOpen && selectedMechanicId === "gps-arrival" && <section className="maker-gps-arrival-locations" aria-labelledby="gps-arrival-locations-title">
              <div className="maker-gps-arrival-locations-heading"><div><span>조사 지점</span><h3 id="gps-arrival-locations-title">도착 위치와 획득 증거물을 설정하세요.</h3><p>기본 1개이며, 최대 3개의 지점을 순서대로 설정할 수 있습니다.</p></div><button type="button" onClick={addGpsArrivalLocation} disabled={gpsArrivalLocations.length >= 3}>+ 지점 추가</button></div>
              {gpsArrivalLocations.map((location, index) => <section className="maker-gps-arrival-location" key={location.id} aria-label={`조사 지점 ${index + 1}`}><div className="maker-gps-arrival-location-heading"><strong>조사 지점 {String(index + 1).padStart(2, "0")}</strong>{gpsArrivalLocations.length > 1 && <button type="button" onClick={() => updateGpsArrivalLocations(gpsArrivalLocations.filter((item) => item.id !== location.id))}>삭제</button>}</div><div className="maker-gps-arrival-fields"><label><span>현장 이름</span><input value={location.name} onChange={(event) => updateGpsArrivalLocation(location.id, { name: event.target.value })} /></label><label><span>주소</span><input value={location.address} onChange={(event) => updateGpsArrivalLocation(location.id, { address: event.target.value })} /></label><label><span>위도</span><input type="number" step="0.000001" value={location.latitude} onChange={(event) => updateGpsArrivalLocation(location.id, { latitude: event.target.value })} /></label><label><span>경도</span><input type="number" step="0.000001" value={location.longitude} onChange={(event) => updateGpsArrivalLocation(location.id, { longitude: event.target.value })} /></label><label><span>도착 반경</span><div className="maker-mechanic-input"><input type="number" min="1" value={location.radius} onChange={(event) => updateGpsArrivalLocation(location.id, { radius: event.target.value })} /><b>m</b></div></label></div><LocationPicker title={`조사 지점 ${index + 1} 위치`} guide="지도에서 핀을 찍으면 이 지점의 위도와 경도가 자동으로 입력됩니다." latitude={location.latitude} longitude={location.longitude} placeName={location.name} address={location.address} onLocationChange={(latitude, longitude) => updateGpsArrivalLocation(location.id, { latitude, longitude })} /><section className="maker-gps-arrival-reward"><div><span>도착 시 획득 증거물</span><small>이 위치에 도착했을 때 추가할 이미지 또는 GLB 3D 모델입니다.</small></div><label><span>증거물 유형</span><select value={location.rewardType} onChange={(event) => updateGpsArrivalLocation(location.id, { rewardType: event.target.value as "image" | "model", rewardAsset: "", rewardAssetName: "" })}><option value="image">이미지</option><option value="model">3D 모델 (GLB)</option></select></label>{location.rewardAsset ? <div className="maker-gps-arrival-reward-selected">{location.rewardType === "image" ? <Image src={location.rewardAsset} alt={`${location.name} 증거물 미리보기`} width={180} height={120} unoptimized /> : <b>GLB</b>}<div><strong>{location.rewardAssetName || "획득 증거물"}</strong><label className="maker-scan-reference-replace"><input type="file" accept={location.rewardType === "image" ? "image/*" : ".glb,model/gltf-binary"} onChange={(event) => { const file = event.target.files?.[0]; if (file) addGpsArrivalRewardAsset(location.id, file); event.target.value = ""; }} /><span>자산 교체</span></label><button type="button" onClick={() => updateGpsArrivalLocation(location.id, { rewardAsset: "", rewardAssetName: "" })}>삭제</button></div></div> : <label className="maker-scan-reference-upload"><input type="file" accept={location.rewardType === "image" ? "image/*" : ".glb,model/gltf-binary"} onChange={(event) => { const file = event.target.files?.[0]; if (file) addGpsArrivalRewardAsset(location.id, file); event.target.value = ""; }} /><span>+ {location.rewardType === "image" ? "증거물 이미지" : "GLB 모델"} 첨부</span></label>}</section></section>)}
            </section>}
            {isMechanicEditorOpen && selectedMechanicId === "card-ordering" && <section className="maker-ordering-cards" aria-labelledby="ordering-cards-title"><div className="maker-ordering-cards-heading"><div><span>배열할 카드</span><h3 id="ordering-cards-title">플레이어가 정렬할 빈 카드를 준비하세요.</h3><p>각 카드에는 이미지를 선택해 넣을 수 있습니다.</p></div><button type="button" onClick={addOrderingCard} disabled={orderingCards.length >= 5}>+ 카드 추가</button></div><div className="maker-ordering-card-list">{orderingCards.map((card, index) => <article key={card.id}>{card.imageUrl ? <Image src={card.imageUrl} alt={`${index + 1}번 카드 이미지`} width={180} height={112} unoptimized /> : <div className="maker-ordering-card-blank">CARD {String(index + 1).padStart(2, "0")}</div>}<div><strong>카드 {String(index + 1).padStart(2, "0")}</strong><label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addOrderingCardImage(card.id, file); event.target.value = ""; }} /><span>{card.imageUrl ? "이미지 교체" : "이미지 추가"}</span></label>{orderingCards.length > 2 && <button type="button" onClick={() => updateOrderingCards(orderingCards.filter((item) => item.id !== card.id))}>삭제</button>}</div></article>)}</div></section>}
            </>}</section>
            {isMechanicEditorOpen && selectedMechanic.category === "ar" && <section className="maker-ar-location-setting" aria-labelledby="ar-location-title"><div><span>AR 시작 위치</span><h3 id="ar-location-title">AR을 시작할 현장을 설정하세요.</h3><p>플레이어가 이 반경에 도착해야 AR 실행 버튼이 활성화됩니다.</p></div><div className="maker-gps-arrival-fields"><label><span>현장 이름</span><input value={selectedScene.mechanicConfig?.arPlaceName ?? "AR 조사 지점"} onChange={(event) => updateMechanicConfig("arPlaceName", event.target.value)} /></label><label><span>주소</span><input value={selectedScene.mechanicConfig?.arAddress ?? ""} onChange={(event) => updateMechanicConfig("arAddress", event.target.value)} /></label><label><span>위도</span><input type="number" step="0.000001" value={selectedScene.mechanicConfig?.arLatitude ?? "37.550416"} onChange={(event) => updateMechanicConfig("arLatitude", event.target.value)} /></label><label><span>경도</span><input type="number" step="0.000001" value={selectedScene.mechanicConfig?.arLongitude ?? "127.073818"} onChange={(event) => updateMechanicConfig("arLongitude", event.target.value)} /></label><label><span>도착 반경</span><div className="maker-mechanic-input"><input type="number" min="1" value={selectedScene.mechanicConfig?.arRadius ?? "20"} onChange={(event) => updateMechanicConfig("arRadius", event.target.value)} /><b>m</b></div></label></div><LocationPicker title="AR 시작 위치" guide="지도에서 핀을 찍으면 AR 시작 위치의 위도와 경도가 자동으로 입력됩니다." latitude={selectedScene.mechanicConfig?.arLatitude ?? "37.550416"} longitude={selectedScene.mechanicConfig?.arLongitude ?? "127.073818"} placeName={selectedScene.mechanicConfig?.arPlaceName ?? "AR 조사 지점"} address={selectedScene.mechanicConfig?.arAddress ?? ""} onLocationChange={(arLatitude, arLongitude) => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? getDefaultMechanicConfig(selectedMechanicId)), arLatitude, arLongitude } })} />{selectedMechanicId === "image-scan" && <section className="maker-scan-reference" aria-label="인식 기준 이미지"><div><span>완료 인식 이미지 <i>필수</i></span><small>현장에서 이 이미지를 인식하면 이미지 인식 기믹이 완료됩니다.</small></div>{(selectedScene.mechanicConfig?.arRecognitionImage ?? selectedScene.mechanicConfig?.scanReferenceImage) ? <div className="maker-scan-reference-selected"><Image src={selectedScene.mechanicConfig?.arRecognitionImage ?? selectedScene.mechanicConfig?.scanReferenceImage ?? ""} alt="인식 기준 이미지 미리보기" width={180} height={120} unoptimized /><div><strong>{selectedScene.mechanicConfig?.arRecognitionImageName ?? selectedScene.mechanicConfig?.scanReferenceImageName ?? "인식 기준 이미지"}</strong><label className="maker-scan-reference-replace"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addScanReferenceImage(file); event.target.value = ""; }} /><span>이미지 교체</span></label><button type="button" onClick={() => updateScene({ mechanicConfig: { ...(selectedScene.mechanicConfig ?? {}), arRecognitionImage: "", arRecognitionImageName: "", scanReferenceImage: "", scanReferenceImageName: "" } })}>삭제</button></div></div> : <label className="maker-scan-reference-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addScanReferenceImage(file); event.target.value = ""; }} /><span>+ 인식 기준 이미지 첨부</span></label>}<p>이미지당 500KB 이하로 첨부해 주세요.</p></section>}</section>}
          </div>
          <section className="maker-page-ending" aria-labelledby="page-ending-title">
            <div><span>PAGE ENDING</span><h2 id="page-ending-title">페이지 종료 방식을 정하세요.</h2><p>이 챕터의 내용과 기믹이 끝난 뒤 플레이어에게 보여줄 마지막 흐름입니다.</p></div>
            <div className="maker-page-ending-options" role="radiogroup" aria-label="페이지 종료 방식">{pageEndingModes.map((mode) => <button key={mode.id} className={endingMode === mode.id ? "is-selected" : ""} type="button" role="radio" aria-checked={endingMode === mode.id} onClick={() => updateScene({ endingMode: mode.id })}><b>{mode.number}</b><strong>{mode.label}</strong><small>{mode.description}</small></button>)}</div>
            {endingMode === "none" && <div className="maker-page-ending-detail"><div><span>기본 버튼 설정</span><strong>다음 장면으로 넘어가는 버튼 문구를 설정하세요.</strong></div><div className="maker-page-ending-fields"><label><span>버튼 문구</span><input value={endingConfig.noneActionLabel ?? (selectedSceneIndex === draft.scenes.length - 1 ? "완료" : "다음")} placeholder="예: 조사 시작" onChange={(event) => updateEndingConfig("noneActionLabel", event.target.value)} /></label></div></div>}
            {endingMode === "submission" && <div className="maker-page-ending-detail"><div><span>진행률 설정</span><strong>내용과 완료까지 걸리는 시간을 설정하세요.</strong></div><div className="maker-page-ending-fields"><label><span>제목</span><input value={endingConfig.submissionTitle ?? "기록을 제출하고 있습니다"} onChange={(event) => updateEndingConfig("submissionTitle", event.target.value)} /></label><label><span>차는 시간</span><input type="number" min="1" max="5" value={endingConfig.submissionDuration ?? "3"} onChange={(event) => updateEndingConfig("submissionDuration", String(Math.min(5, Math.max(1, Number(event.target.value) || 1))))} /></label><label><span>버튼 문구</span><input value={endingConfig.submissionActionLabel ?? "제출"} placeholder="예: 분석 시작" onChange={(event) => updateEndingConfig("submissionActionLabel", event.target.value)} /></label><label className="maker-page-ending-wide"><span>안내 내용</span><textarea rows={3} value={endingConfig.submissionBody ?? "분석 결과를 정리하고 있습니다."} onChange={(event) => updateEndingConfig("submissionBody", event.target.value)} /></label></div></div>}
            {endingMode === "messenger" && <div className="maker-page-ending-detail"><div><span>메신저 대화 설정</span><strong>페이지 끝에서 알림 팝업으로 전달할 내용을 설정하세요.</strong></div><div className="maker-page-ending-fields"><label><span>발신자</span><input value={endingConfig.messengerSender ?? "DROPLINK"} onChange={(event) => updateEndingConfig("messengerSender", event.target.value)} /></label><label><span>알림 문구</span><input value={endingConfig.messengerNotice ?? "새로운 메시지가 도착했습니다."} onChange={(event) => updateEndingConfig("messengerNotice", event.target.value)} /></label><div className="maker-content-message-list maker-page-ending-wide"><span>대화 내용</span>{endingMessengerMessages.map((message, index) => <label key={`ending-message-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><textarea rows={2} value={message} placeholder="대화 한 줄" onChange={(event) => { const messages = [...endingMessengerMessages]; messages[index] = event.target.value; updateEndingMessengerMessages(messages); }} />{endingMessengerMessages.length > 1 && <button type="button" onClick={() => updateEndingMessengerMessages(endingMessengerMessages.filter((_, messageIndex) => messageIndex !== index))}>삭제</button>}</label>)}<button className="maker-add-content-message" type="button" onClick={() => updateEndingMessengerMessages([...endingMessengerMessages, ""])}>+ 대화 추가</button></div></div></div>}
          </section>
          <section className="maker-chapter-evidence maker-page-evidence-config" aria-labelledby="evidence-title">
            <div className="maker-chapter-evidence-heading"><div><h2 id="evidence-title">추가 증거물 획득</h2><p>기믹에서 얻는 보상과 별도로, 이 챕터를 마칠 때 플레이어 인벤토리에 추가할 증거물입니다.</p></div></div>
            <div className="maker-additional-evidence-options" role="radiogroup" aria-label="추가 증거물 획득 여부">
              <button className={!isAdditionalEvidenceEnabled ? "is-selected" : ""} type="button" role="radio" aria-checked={!isAdditionalEvidenceEnabled} onClick={() => setAdditionalEvidenceEnabled(false)}><b>0</b><strong>획득하지 않음</strong><small>기믹 보상만 획득합니다.</small></button>
              <button className={isAdditionalEvidenceEnabled ? "is-selected" : ""} type="button" role="radio" aria-checked={isAdditionalEvidenceEnabled} onClick={() => setAdditionalEvidenceEnabled(true)}><b>1</b><strong>증거물 획득</strong><small>챕터 완료 보상을 추가합니다.</small></button>
            </div>
            {isAdditionalEvidenceEnabled && <>
              {chapterEvidence.length > 0 && <button className="maker-evidence-modal-preview" type="button" onClick={() => openPreviewEvidenceModal(chapterEvidence.map((item) => ({ id: item.id, name: item.name, asset: item.imageUrl, assetType: "image" })))}>획득 모달 미리보기</button>}
              <label className="maker-evidence-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addEvidence(file); event.target.value = ""; }} /><span>+ 증거물 이미지 첨부</span></label>
              {chapterEvidence.length > 0 ? <div className="maker-evidence-list">{chapterEvidence.map((evidence) => <article key={evidence.id}><Image src={evidence.imageUrl} alt={`${evidence.name} 증거물 미리보기`} width={360} height={248} unoptimized /><div><span>추가 획득 증거물</span><strong>{evidence.name}</strong></div><button type="button" onClick={() => removeEvidence(evidence.id)} aria-label={`${evidence.name} 삭제`}>삭제</button></article>)}</div> : <div className="maker-evidence-empty"><strong>챕터를 마칠 때 추가할 증거물을 첨부해 주세요.</strong><span>기믹에서 얻는 증거물과 별도로 플레이어 인벤토리에 추가됩니다.</span></div>}
              <small className="maker-evidence-note">현재는 초안 저장 시 이 기기에만 보관됩니다. 이미지당 500KB, 게임당 최대 5개까지 첨부할 수 있어요.</small>
            </>}
          </section>
          {endingMode === "messenger" && <section className="maker-messenger-asset maker-page-messenger-asset" aria-label="페이지 종료 메신저 상단 이미지"><div><span>상단 사각형 이미지</span><small>기본 DROPLINK 대신 페이지 종료 메신저에 표시할 이미지를 첨부할 수 있습니다.</small></div>{endingConfig.messengerImage ? <div className="maker-messenger-asset-selected"><Image src={endingConfig.messengerImage} alt="페이지 종료 메신저 이미지 미리보기" width={58} height={58} unoptimized /><div><strong>{endingConfig.messengerImageName || "메신저 이미지"}</strong><label><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addEndingMessengerImage(file); event.target.value = ""; }} /><span>이미지 교체</span></label><button type="button" onClick={() => updateScene({ endingConfig: { ...endingConfig, messengerImage: "", messengerImageName: "" } })}>기본 DROPLINK 사용</button></div></div> : <label className="maker-messenger-asset-upload"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) addEndingMessengerImage(file); event.target.value = ""; }} /><span>+ 이미지 첨부</span></label>}</section>}
          <div className="maker-chapter-complete">
            {selectedSceneIndex < draft.scenes.length - 1 ? <button type="button" onClick={() => { saveDraft(); chooseScene(draft.scenes[selectedSceneIndex + 1]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>다음 챕터 <span aria-hidden="true">→</span></button> : <button type="button" onClick={openPlaytest}>완료 <span aria-hidden="true">→</span></button>}
          </div>
        </section>

        <aside className="maker-preview-panel" aria-label="게임 미리보기">
          <div className="maker-preview-heading"><span>LIVE PREVIEW</span><b>현재 초안</b></div>
          <div className="maker-live-device" aria-label="휴대폰 화면 비율 미리보기"><div className="maker-live-device-speaker" /><div className={`maker-live-device-screen is-${draft.tone}`} style={livePreviewStyle}>{hasVisibleSceneHeading && <div className="maker-preview-chapter-title">{isSubtitleVisible && selectedScene.subtitle && <small>{selectedScene.subtitle}</small>}{isTitleVisible && <strong>{selectedScene.title}</strong>}</div>}<div className="maker-preview-flow" aria-label="플레이 순서 미리보기">{flowOrder.map((flowId) => { if (flowId === "mechanic") return <div key={flowId}>{renderMechanicPreview()}</div>; const block = contentBlocks.find((contentBlock) => contentBlock.id === flowId); if (!block) return null; return <article className={`maker-preview-flow-item is-content-screen is-${block.format} ${block.id === sceneContent.id ? "is-selected" : ""} ${draggedFlowId === flowId ? "is-dragging" : ""}`} key={flowId} draggable onClick={() => editContentBlock(block)} onDragStart={() => setDraggedFlowId(flowId)} onDragEnd={() => setDraggedFlowId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveFlowBlock(flowId)}>{renderContentBlockPreview(block)}<i>⠿</i></article>; })}</div>{endingMode === "none" && <button className="maker-preview-page-next" type="button">{endingConfig.noneActionLabel || (selectedSceneIndex === draft.scenes.length - 1 ? "완료" : "다음")}</button>}{endingMode === "submission" && <button className="maker-preview-page-next maker-page-ending-action" type="button" onClick={() => { setIsPreviewSubmissionComplete(false); setIsPreviewSubmissionOpen(true); }}>{endingConfig.submissionActionLabel || "제출"}</button>}{isPresentationPlaying && selectedTemplate.id !== "none" && <div className={`maker-live-presentation is-${selectedTemplate.id}`} aria-live="polite"><div className="maker-live-presentation-copy"><h2>{presentationContent || "연출 내용"}</h2></div></div>}{activePreviewEvidenceItem && <div className="maker-evidence-acquisition-modal" role="dialog" aria-modal="true" aria-label="증거물 획득"><section><span>증거물 획득</span><h2>새 증거물을 확보했습니다.</h2><article>{activePreviewEvidenceItem.asset && activePreviewEvidenceItem.assetType === "image" ? <Image src={activePreviewEvidenceItem.asset} alt={activePreviewEvidenceItem.name} width={280} height={210} unoptimized /> : <i>3D</i>}<strong>{activePreviewEvidenceItem.name}</strong></article><button type="button" onClick={closePreviewEvidenceModal}>{previewEvidenceItems && previewEvidenceIndex < previewEvidenceItems.length - 1 ? "다음 증거물" : "확인"}</button></section></div>}{isPreviewSubmissionOpen && <div className="maker-page-progress-modal" role="dialog" aria-modal="true" aria-label="진행률"><section><span>진행률</span><h2>{endingConfig.submissionTitle || "기록을 제출하고 있습니다"}</h2><p>{endingConfig.submissionBody || "분석 결과를 정리하고 있습니다."}</p><div><i style={{ "--maker-progress-duration": `${previewSubmissionDuration}s` } as CSSProperties} /><b>{isPreviewSubmissionComplete ? "완료" : "진행 중"}</b></div><button type="button" disabled={!isPreviewSubmissionComplete} onClick={() => setIsPreviewSubmissionOpen(false)}>{isPreviewSubmissionComplete ? "확인" : "진행 중…"}</button></section></div>}</div></div>
        </aside>
      </section>
    </main>
  );
}
