"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { cloneDefaultDraft, getArActionLabel, getSceneEstimatedMinutes, getSceneMechanic, type GameDraft, type MakerScene, type SceneContent } from "../gameDraft";
import { loadMakerDraft, saveMakerDraft } from "../draftStorage";

type PlayerFlowItem = { id: string; kind: "mechanic" } | { id: string; kind: "content"; content: SceneContent };
type GpsLocation = { id: string; name: string; address: string; latitude: string; longitude: string; radius: string; rewardType: "image" | "model"; rewardAsset?: string; rewardAssetName?: string };
type MessengerQueueItem = { id: string; sender: string; notification: string; messages: string[]; image?: string; isEnding?: boolean };
type EvidenceModalItem = { id: string; name: string; asset?: string; assetType: "image" | "model" };
const EMPTY_ENDING_CONFIG: Record<string, string> = {};

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function getContentBlocks(scene: MakerScene) {
  if (scene.contentBlocks?.length) return scene.contentBlocks;
  return [{ id: "content-initial", format: "text" as const, label: "안내", body: scene.body, messages: [scene.body] }];
}

function getFlowItems(scene: MakerScene): PlayerFlowItem[] {
  const blocks = getContentBlocks(scene);
  const order = scene.flowOrder?.length ? scene.flowOrder : ["mechanic", ...blocks.map((block) => block.id ?? "content-initial")];
  const items = order.flatMap((id) => {
    if (id === "mechanic") return getSceneMechanic(scene).id === "none" ? [] : [{ id, kind: "mechanic" as const }];
    const content = blocks.find((block) => block.id === id);
    return content ? [{ id, kind: "content" as const, content }] : [];
  });
  return items;
}

function getMessages(content: SceneContent) {
  return content.messages?.filter(Boolean).length ? content.messages.filter(Boolean) : [content.body || "내용을 입력하세요."];
}

function getEndingMessages(config: Record<string, string> | undefined) {
  try {
    const messages = JSON.parse(config?.messengerMessages ?? "[]");
    if (Array.isArray(messages) && messages.length) return messages.filter((message) => typeof message === "string" && message.trim());
  } catch { /* Older drafts store one message. */ }
  return [config?.messengerMessage ?? "다음 단서를 확인해 주세요."];
}

function getGpsLocations(config: Record<string, string> | undefined): GpsLocation[] {
  try {
    const locations = JSON.parse(config?.gpsLocations ?? "[]") as GpsLocation[];
    if (Array.isArray(locations) && locations.length) return locations;
  } catch { /* Older drafts store one location. */ }
  return [{ id: "gps-location-1", name: config?.placeName ?? "조사 지점", address: config?.address ?? "", latitude: config?.latitude ?? "37.550416", longitude: config?.longitude ?? "127.073818", radius: config?.radius ?? "20", rewardType: "image" }];
}

function getMechanicEvidence(scene: MakerScene): EvidenceModalItem[] {
  const config = scene.mechanicConfig ?? {};
  if (scene.mechanicType === "gps-arrival") return getGpsLocations(config).filter((location) => location.rewardAsset).map((location) => ({ id: location.id, name: location.rewardAssetName || `${location.name} 증거물`, asset: location.rewardAsset, assetType: location.rewardType }));
  if (config.rewardAsset) return [{ id: `mechanic-${scene.id}`, name: config.rewardAssetName || "획득 증거물", asset: config.rewardAsset, assetType: config.rewardType === "model" ? "model" : "image" }];
  return [];
}

export default function PlaytestMakerPage() {
  const [draft, setDraft] = useState<GameDraft>(cloneDefaultDraft);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [presentationSceneId, setPresentationSceneId] = useState<string | null>(null);
  const [mechanicReady, setMechanicReady] = useState(false);
  const [arLocationReached, setArLocationReached] = useState(false);
  const [isArScannerOpen, setIsArScannerOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("");
  const [openedMessengerBlockId, setOpenedMessengerBlockId] = useState<string | null>(null);
  const [visibleMessengerIndex, setVisibleMessengerIndex] = useState(-1);
  const [messengerLineIndex, setMessengerLineIndex] = useState(0);
  const [typedMessengerText, setTypedMessengerText] = useState("");
  const [npcLineIndex, setNpcLineIndex] = useState(0);
  const [typedNpcText, setTypedNpcText] = useState("");
  const [submissionStarted, setSubmissionStarted] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [evidenceModalItems, setEvidenceModalItems] = useState<EvidenceModalItem[] | null>(null);
  const [evidenceModalIndex, setEvidenceModalIndex] = useState(0);
  const [advanceAfterEvidence, setAdvanceAfterEvidence] = useState(false);
  const [completedFlowIds, setCompletedFlowIds] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    window.queueMicrotask(() => {
      if (!isActive) return;
      setDraft(loadMakerDraft());
    });
    return () => { isActive = false; };
  }, []);

  const scene = draft.scenes[sceneIndex];
  const mechanic = getSceneMechanic(scene);
  const flowItems = getFlowItems(scene);
  const isFlowItemComplete = (item: PlayerFlowItem) => completedFlowIds.includes(item.id) || (item.kind === "content" && (item.content.format === "card" || item.content.format === "text"));
  const activeFlowItem = flowItems.find((item) => !isFlowItemComplete(item));
  const activeFlowId = activeFlowItem?.id ?? null;
  const isFlowComplete = !activeFlowItem;
  const endingConfig = scene.endingConfig ?? EMPTY_ENDING_CONFIG;
  const submissionDuration = Math.min(5, Math.max(1, Number(endingConfig.submissionDuration ?? "3") || 3));
  const hasAdditionalEvidence = draft.chapterEvidenceEnabled?.[scene.id] === true;
  const messengerQueue = useMemo<MessengerQueueItem[]>(() => [
    ...getContentBlocks(scene).filter((content) => content.format === "droplink" && content.id).map((content) => ({ id: content.id!, sender: content.sender || "DROPLINK", notification: content.notification || "새로운 메시지가 도착했습니다.", messages: getMessages(content), image: content.messengerImage })),
    ...(scene.endingMode === "messenger" ? [{ id: `ending-${scene.id}`, sender: endingConfig.messengerSender || "DROPLINK", notification: endingConfig.messengerNotice || "새로운 메시지가 도착했습니다.", messages: getEndingMessages(endingConfig), image: endingConfig.messengerImage, isEnding: true }] : []),
  ], [endingConfig, scene]);
  const activeMessenger = messengerQueue[visibleMessengerIndex];
  const activeEvidenceItem = evidenceModalItems?.[evidenceModalIndex] ?? null;
  const messengerSignature = messengerQueue.map((item) => item.id).join("|");
  const activeDroplinkId = activeFlowItem?.kind === "content" && activeFlowItem.content.format === "droplink" ? activeFlowItem.id : null;
  const activeNpcContent = activeFlowItem?.kind === "content" && activeFlowItem.content.format === "modal" && activeFlowItem.content.modalType === "npc" ? activeFlowItem.content : null;
  const activeNpcLine = activeNpcContent ? getMessages(activeNpcContent)[npcLineIndex] ?? "" : "";
  const totalMinutes = draft.scenes.reduce((total, item) => total + getSceneEstimatedMinutes(item), 0);
  const playtestStyle = {
    "--playtest-primary": isHexColor(draft.colors.primary) ? draft.colors.primary : "#b9e650",
    "--playtest-secondary": isHexColor(draft.colors.secondary) ? draft.colors.secondary : "#27443e",
    "--playtest-special": isHexColor(draft.colors.special) ? draft.colors.special : "#f1d169",
    "--playtest-text": isHexColor(draft.colors.text) ? draft.colors.text : "#14231d",
    "--playtest-background": isHexColor(draft.colors.background) ? draft.colors.background : "#f4f5ed",
    "--maker-preview-primary": isHexColor(draft.colors.primary) ? draft.colors.primary : "#b9e650",
    "--maker-preview-secondary": isHexColor(draft.colors.secondary) ? draft.colors.secondary : "#27443e",
    "--maker-preview-special": isHexColor(draft.colors.special) ? draft.colors.special : "#f1d169",
    "--maker-preview-text": isHexColor(draft.colors.text) ? draft.colors.text : "#14231d",
    "--maker-preview-background": isHexColor(draft.colors.background) ? draft.colors.background : "#f4f5ed",
  } as CSSProperties;

  useEffect(() => {
    if (scene.template === "none") return;
    const startTimer = window.setTimeout(() => setPresentationSceneId(scene.id), 0);
    const endTimer = window.setTimeout(() => setPresentationSceneId(null), 1500);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [scene.id, scene.template]);

  useEffect(() => {
    if (visibleMessengerIndex !== -1) return;
    const nextMessengerIndex = activeDroplinkId
      ? messengerQueue.findIndex((item) => item.id === activeDroplinkId)
      : isFlowComplete && scene.endingMode === "messenger"
        ? messengerQueue.findIndex((item) => item.isEnding)
        : -1;
    if (nextMessengerIndex < 0) return;
    const timer = window.setTimeout(() => setVisibleMessengerIndex(nextMessengerIndex), 2000);
    return () => window.clearTimeout(timer);
  }, [activeDroplinkId, isFlowComplete, messengerQueue, messengerSignature, scene.endingMode, visibleMessengerIndex]);

  useEffect(() => {
    if (scene.endingMode !== "submission" || !submissionStarted) return;
    const timer = window.setTimeout(() => setSubmissionComplete(true), submissionDuration * 1000);
    return () => window.clearTimeout(timer);
  }, [scene.id, scene.endingMode, submissionDuration, submissionStarted]);

  const activeMessengerId = activeMessenger?.id;
  const activeMessengerLine = activeMessenger?.messages[messengerLineIndex] ?? "";

  useEffect(() => {
    if (!activeMessengerId || openedMessengerBlockId !== activeMessengerId) return;
    let characterIndex = 0;
    let typeTimer: number | null = null;
    const startTimer = window.setTimeout(() => {
      typeTimer = window.setInterval(() => {
        characterIndex += 1;
        setTypedMessengerText(activeMessengerLine.slice(0, characterIndex));
        if (characterIndex >= activeMessengerLine.length && typeTimer !== null) window.clearInterval(typeTimer);
      }, 34);
    }, 440);
    return () => {
      window.clearTimeout(startTimer);
      if (typeTimer !== null) window.clearInterval(typeTimer);
    };
  }, [activeMessengerId, activeMessengerLine, openedMessengerBlockId]);

  useEffect(() => {
    if (!activeNpcContent) return;
    const speed = activeNpcContent.npcTextSpeed ?? "normal";
    const interval = speed === "fast" ? 16 : speed === "instant" ? 0 : 30;
    let characterIndex = 0;
    let typeTimer: number | null = null;
    const startTimer = window.setTimeout(() => {
      if (interval === 0) {
        setTypedNpcText(activeNpcLine);
        return;
      }
      typeTimer = window.setInterval(() => {
        characterIndex += 1;
        setTypedNpcText(activeNpcLine.slice(0, characterIndex));
        if (characterIndex >= activeNpcLine.length && typeTimer !== null) window.clearInterval(typeTimer);
      }, interval);
    }, 180);
    return () => {
      window.clearTimeout(startTimer);
      if (typeTimer !== null) window.clearInterval(typeTimer);
    };
  }, [activeNpcContent, activeNpcLine, npcLineIndex]);

  function saveDraft() {
    saveMakerDraft(draft);
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }

  function openScene(index: number) {
    setSceneIndex(index);
    setMechanicReady(false);
    setArLocationReached(false);
    setIsArScannerOpen(false);
    setAnswer("");
    setNotice("");
    setOpenedMessengerBlockId(null);
    setVisibleMessengerIndex(-1);
    setMessengerLineIndex(0);
    setTypedMessengerText("");
    setNpcLineIndex(0);
    setTypedNpcText("");
    setSubmissionStarted(false);
    setSubmissionComplete(false);
    setEvidenceModalItems(null);
    setEvidenceModalIndex(0);
    setAdvanceAfterEvidence(false);
    setCompletedFlowIds([]);
    setIsFinished(false);
  }

  function advanceChapter() {
    if (sceneIndex === draft.scenes.length - 1) {
      setIsFinished(true);
      return;
    }
    openScene(sceneIndex + 1);
  }

  function nextChapter() {
    if (!isFlowComplete) return;
    if (scene.endingMode === "messenger") {
      const endingIndex = messengerQueue.findIndex((item) => item.isEnding);
      if (endingIndex >= 0) setVisibleMessengerIndex(endingIndex);
      return;
    }
    requestChapterAdvance();
  }

  function requestChapterAdvance() {
    if (!isFlowComplete) return;
    const additionalEvidence = hasAdditionalEvidence ? (draft.chapterEvidence?.[scene.id] ?? []).map((item) => ({ id: item.id, name: item.name, asset: item.imageUrl, assetType: "image" as const })) : [];
    if (additionalEvidence.length) {
      setAdvanceAfterEvidence(true);
      openEvidenceModal(additionalEvidence);
      return;
    }
    advanceChapter();
  }

  function closeEvidenceModal() {
    if (evidenceModalItems && evidenceModalIndex < evidenceModalItems.length - 1) {
      setEvidenceModalIndex((current) => current + 1);
      return;
    }
    setEvidenceModalItems(null);
    setEvidenceModalIndex(0);
    if (!advanceAfterEvidence) return;
    setAdvanceAfterEvidence(false);
    advanceChapter();
  }

  function openEvidenceModal(items: EvidenceModalItem[]) {
    setEvidenceModalIndex(0);
    setEvidenceModalItems(items);
  }

  function completeFlowItem(id: string) {
    setCompletedFlowIds((current) => current.includes(id) ? current : [...current, id]);
  }

  function completeMechanic() {
    if (activeFlowId !== "mechanic") return;
    const isArMechanic = ["image-scan", "ar-treasure"].includes(mechanic.id);
    if (isArMechanic && (!arLocationReached || !isArScannerOpen)) return;
    if (mechanic.id === "text-answer") {
      const correctAnswer = scene.mechanicConfig?.answer ?? "기린";
      if (answer.trim() !== correctAnswer.trim()) {
        setNotice("정답이 아닙니다. 다시 확인해 주세요.");
        return;
      }
      setNotice(scene.mechanicConfig?.successMessage ?? "정답입니다.");
    } else {
      setNotice(scene.mechanicConfig?.successMessage ?? "");
    }
    setMechanicReady(true);
    completeFlowItem("mechanic");
    const mechanicEvidence = getMechanicEvidence(scene);
    if (mechanicEvidence.length) openEvidenceModal(mechanicEvidence);
  }

  function closeMessenger() {
    if (activeMessenger?.isEnding) {
      setOpenedMessengerBlockId(null);
      setVisibleMessengerIndex(-1);
      setMessengerLineIndex(0);
      setTypedMessengerText("");
      requestChapterAdvance();
      return;
    }
    setOpenedMessengerBlockId(null);
    setMessengerLineIndex(0);
    setTypedMessengerText("");
    completeFlowItem(activeMessenger?.id ?? "");
    setVisibleMessengerIndex(-1);
  }

  function advanceMessengerDialogue() {
    if (!activeMessenger) return;
    if (typedMessengerText.length < activeMessengerLine.length) return;
    if (messengerLineIndex < activeMessenger.messages.length - 1) {
      setTypedMessengerText("");
      setMessengerLineIndex((current) => current + 1);
      return;
    }
    closeMessenger();
  }

  function advanceNpcDialogue() {
    if (!activeNpcContent || !activeFlowId) return;
    const messages = getMessages(activeNpcContent);
    if (typedNpcText.length < activeNpcLine.length) {
      setTypedNpcText(activeNpcLine);
      return;
    }
    if (npcLineIndex < messages.length - 1) {
      setTypedNpcText("");
      setNpcLineIndex((current) => current + 1);
      return;
    }
    setNpcLineIndex(0);
    setTypedNpcText("");
    completeFlowItem(activeFlowId);
  }

  function renderContent(content: SceneContent, isActive: boolean) {
    const messages = getMessages(content);
    const completeContent = () => { if (content.id) completeFlowItem(content.id); };
    const action = <button className="maker-flow-complete-button" type="button" disabled={!isActive} onClick={completeContent}>{isActive ? "확인" : "이전 단계 진행 중"}</button>;
    if (content.format === "card") return <article className="maker-content-preview maker-preview-content-screen is-card">{content.imageUrl && <Image src={content.imageUrl} alt={content.imageName || content.title || "정보 카드 이미지"} width={760} height={360} unoptimized />}<div className="maker-content-preview-card"><span>{content.label || "정보 카드"}</span><strong>{content.title || "카드 제목"}</strong><p>{content.body || "카드 내용을 입력하세요."}</p></div></article>;
    if (content.format === "droplink") return <article className="maker-content-preview maker-preview-content-screen is-droplink"><div className={`maker-content-preview-droplink ${openedMessengerBlockId === content.id ? "is-open" : ""}`}><button className="maker-messenger-popup" type="button" onClick={() => setOpenedMessengerBlockId(content.id ?? null)}><span>{content.sender || "DROPLINK"}</span><strong>{content.notification || "새로운 메시지가 도착했습니다."}</strong><em>지금</em></button>{openedMessengerBlockId === content.id && <section className="maker-messenger-conversation">{messages.map((message, index) => <p key={index}>{message}</p>)}</section>}</div></article>;
    if (content.format === "modal") {
      if (content.modalType === "npc") return <article className="maker-content-preview maker-preview-content-screen is-modal"><div className="maker-content-preview-modal is-npc"><div className="maker-modal-npc-heading">{content.npcImage ? <Image src={content.npcImage} alt={`${content.sender || "NPC"} 이미지`} width={42} height={42} unoptimized /> : <i>NPC</i>}<span>{content.sender || "NPC"}</span><em>대화</em></div><section>{messages.map((message, index) => <p key={index}>{message}</p>)}</section>{action}</div></article>;
      const progress = Math.min(100, Math.max(0, content.modalProgress ?? 65));
      return <article className="maker-content-preview maker-preview-content-screen is-modal"><div className="maker-content-preview-modal"><span>{content.label || "진행 상태"}</span><strong>{content.title || "진행 중입니다"}</strong><p>{content.body || "조금만 기다려 주세요."}</p><div className="maker-modal-progress"><i style={{ width: `${progress}%` }} /><b>{progress}%</b></div>{action}</div></article>;
    }
    return <article className="maker-content-preview maker-preview-content-screen is-text"><div className="maker-content-preview-text"><span>{content.label || "안내"}</span><p>{content.body || messages[0]}</p></div></article>;
  }

  function renderMechanic(isActive: boolean) {
    const config = scene.mechanicConfig ?? {};
    if (mechanic.id === "gps-arrival") {
      const locations = getGpsLocations(config);
      return <article className="maker-preview-flow-item is-mechanic is-gps"><div className="maker-playtest-gps-map"><div className="maker-playtest-gps-marker" aria-hidden="true" /><div className="maker-preview-gps-map-label"><span>조사 지점</span><strong>{locations[0]?.name || "현장 이름"}</strong></div></div><button type="button" disabled={!isActive} onClick={completeMechanic}>{mechanicReady ? "도착 확인 완료" : "현장 도착 확인"}</button></article>;
    }
    if (["image-scan", "ar-treasure"].includes(mechanic.id)) {
      const placeName = config.arPlaceName || "AR 조사 지점";
      const recognitionImage = config.arRecognitionImage || config.scanReferenceImage;
      const recognitionImageName = config.arRecognitionImageName || config.scanReferenceImageName || "인식 기준 이미지";
      const isTreasureHunt = mechanic.id === "ar-treasure";
      return <article className="maker-preview-flow-item is-mechanic is-ar">
        <div className="maker-playtest-ar-map">
          <div className="maker-playtest-gps-marker" aria-hidden="true" />
          <div className="maker-preview-gps-map-label"><span>AR 시작 위치</span><strong>{placeName}</strong></div>
        </div>
        <button type="button" disabled={!isActive || arLocationReached} onClick={() => setArLocationReached(true)}>{arLocationReached ? "현장 도착 확인 완료" : "현장 도착 확인"}</button>
        <button className="maker-preview-ar-button" type="button" disabled={!isActive || !arLocationReached || isArScannerOpen} onClick={() => setIsArScannerOpen(true)}>{isArScannerOpen ? (isTreasureHunt ? "바닥 인식 중" : "이미지 인식 중") : getArActionLabel(mechanic.id, config)}</button>
        {isArScannerOpen && <section className="maker-ar-recognition-stage" aria-label={isTreasureHunt ? "AR 보물찾기" : "AR 이미지 인식"}>
          {isTreasureHunt ? <i>FLOOR</i> : recognitionImage ? <Image src={recognitionImage} alt={recognitionImageName} width={100} height={82} unoptimized /> : <i>IMAGE</i>}
          <div><span>{isTreasureHunt ? "바닥 인식" : "이미지 인식"}</span><strong>{isTreasureHunt ? config.treasureName || "숨은 보물" : recognitionImageName}</strong><small>{isTreasureHunt ? "바닥을 향하면 평면을 인식해 보물을 표시합니다." : "기준 이미지를 카메라로 인식하면 완료됩니다."}</small></div>
          <button type="button" disabled={!isActive} onClick={completeMechanic}>{isTreasureHunt ? "바닥 인식 완료" : "이미지 인식 완료"}</button>
        </section>}
      </article>;
    }
    if (mechanic.id === "card-ordering") {
      let cards: Array<{ id: string; imageUrl?: string }> = [];
      try { cards = JSON.parse(config.orderingCards ?? "[]"); } catch { /* Blank cards are shown below. */ }
      return <article className="maker-preview-flow-item is-mechanic"><span>기믹</span><strong>{mechanic.label}</strong><small>{config.rule || "카드를 올바른 순서로 배열하세요."}</small><div className="maker-preview-ordering-cards">{(cards.length ? cards : Array.from({ length: 3 }, (_, index) => ({ id: String(index + 1) }))).map((card, index) => <span key={card.id}>{card.imageUrl ? <Image src={card.imageUrl} alt={`${index + 1}번 카드`} width={34} height={34} unoptimized /> : String(index + 1)}</span>)}</div><button type="button" disabled={!isActive} onClick={completeMechanic}>{mechanicReady ? "배열 완료" : "배열 확인"}</button></article>;
    }
    if (mechanic.id === "text-answer") return <article className="maker-preview-flow-item is-mechanic"><span>기믹</span><strong>{mechanic.label}</strong><div className="maker-preview-text-answer"><p>{config.question || "정답을 입력하세요."}</p><input disabled={!isActive} value={answer} placeholder={config.inputPlaceholder || "정답을 입력하세요"} onChange={(event) => setAnswer(event.target.value)} /><button type="button" disabled={!isActive} onClick={completeMechanic}>{config.actionLabel || "확인"}</button></div></article>;
    if (mechanic.id === "direction-tracking") return <article className="maker-preview-flow-item is-mechanic"><span>기믹</span><strong>{mechanic.label}</strong><small>{config.startName || "시작 위치"}에서 {config.direction || "N"} 방향으로 이동하세요.</small><button type="button" disabled={!isActive} onClick={completeMechanic}>{mechanicReady ? "추적 완료" : "방향 확인"}</button></article>;
    if (mechanic.id === "none") return null;
    return <article className="maker-preview-flow-item is-mechanic"><span>기믹</span><strong>{mechanic.label}</strong><small>{mechanic.description}</small></article>;
  }

  function renderEnding() {
    if (scene.endingMode === "submission") {
      return <button className="maker-preview-page-next maker-page-ending-action" type="button" disabled={!isFlowComplete} onClick={() => { if (isFlowComplete) setSubmissionStarted(true); }}>{endingConfig.submissionActionLabel || "제출"}</button>;
    }
    return null;
  }

  return <main className="maker-app maker-playtest-app">
    <header className="maker-topbar"><Link className="maker-brand" href="/maker/identity"><Image src="/campusdrop_logo.png" alt="Campus Drop" width={36} height={36} priority unoptimized /><span>Maker</span></Link><nav className="maker-step-nav" aria-label="Maker 단계"><Link href="/maker/identity">1. Game identity</Link><Link href="/maker/chapter">2. Chapters</Link><strong>3. Playtest</strong></nav><div className="maker-topbar-actions"><span>{savedAt ? `${savedAt}에 이 기기에 저장됨` : "이 기기의 초안을 체험 중"}</span><button className="maker-primary-button" type="button" onClick={saveDraft}>초안 저장</button></div></header>
    <div className="maker-playtest-shell" style={playtestStyle}>
      <aside className="maker-playtest-outline"><div><p>PLAYTEST</p><h1>{draft.title}</h1><span>배치한 순서 그대로 체험하세요.</span></div><ol>{draft.scenes.map((item, index) => <li className={index === sceneIndex && !isFinished ? "is-current" : index < sceneIndex || isFinished ? "is-complete" : ""} key={item.id}><button type="button" onClick={() => openScene(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>CHAPTER {String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></button></li>)}</ol><Link href="/maker/chapter">← 챕터 설정으로 돌아가기</Link></aside>
      <section className="maker-playtest-stage" aria-label="게임 체험 화면">
        {!isFinished ? <div className="maker-playtest-live-wrap">
          <div className="maker-live-device maker-playtest-live-device" aria-label="게임 적용 화면">
            <div className="maker-live-device-speaker" />
            <div className={`maker-live-device-screen is-${draft.tone}`}>
              {((scene.isSubtitleVisible !== false && scene.subtitle) || (scene.isTitleVisible !== false && scene.title)) && <div className="maker-preview-chapter-title">{scene.isSubtitleVisible !== false && scene.subtitle && <small>{scene.subtitle}</small>}{scene.isTitleVisible !== false && scene.title && <strong>{scene.title}</strong>}</div>}
              <div className="maker-preview-flow" aria-label="챕터 적용 화면">{flowItems.filter((item) => item.kind !== "content" || (item.content.format !== "droplink" && !(item.content.format === "modal" && item.content.modalType === "npc"))).map((item) => { const isActive = item.id === activeFlowId; const isLocked = !isFlowItemComplete(item) && !isActive; return item.kind === "mechanic" ? <div className={isLocked ? "is-locked" : ""} key={item.id}>{renderMechanic(isActive)}</div> : <div className={`maker-preview-flow-item is-content-screen ${isLocked ? "is-locked" : ""}`} key={item.id}>{renderContent(item.content, isActive)}</div>; })}</div>
              {presentationSceneId === scene.id && scene.template !== "none" && <div className={`maker-live-presentation is-${scene.template}`} aria-live="polite"><div className="maker-live-presentation-copy"><h2>{scene.presentation?.content || scene.title || "연출 내용"}</h2></div></div>}
              {activeNpcContent && <div className={`maker-npc-dialogue-overlay is-${activeNpcContent.npcPresentation ?? "face"}`} role="dialog" aria-modal="true" aria-label={`${activeNpcContent.sender || "NPC"} 대화`} onClick={advanceNpcDialogue}><section><header>{activeNpcContent.npcImage ? <Image src={activeNpcContent.npcImage} alt={`${activeNpcContent.sender || "NPC"} 이미지`} width={56} height={56} unoptimized /> : <i>NPC</i>}<span>{activeNpcContent.sender || "NPC"}</span><small>{activeNpcContent.npcPresentation === "radio" ? "무전 수신" : activeNpcContent.npcPresentation === "record" ? "기록 낭독" : "대화 중"}</small></header><p>{typedNpcText}<i aria-hidden="true" /></p><em>{typedNpcText.length < activeNpcLine.length ? "화면을 눌러 전체 보기" : "화면을 눌러 계속"}</em></section></div>}
              {scene.endingMode === "none" && <button className="maker-preview-page-next" type="button" disabled={!isFlowComplete} onClick={nextChapter}>{endingConfig.noneActionLabel || (sceneIndex === draft.scenes.length - 1 ? "완료" : "다음")}</button>}
              {scene.endingMode === "submission" && renderEnding()}
              {submissionStarted && <div className="maker-page-progress-modal" role="dialog" aria-modal="true" aria-label="진행률"><section><span>진행률</span><h2>{endingConfig.submissionTitle || "기록을 제출하고 있습니다"}</h2><p>{endingConfig.submissionBody || "분석 결과를 정리하고 있습니다."}</p><div><i style={{ "--maker-progress-duration": `${submissionDuration}s` } as CSSProperties} /><b>{submissionComplete ? "완료" : "진행 중"}</b></div><button type="button" disabled={!submissionComplete} onClick={requestChapterAdvance}>{submissionComplete ? "확인" : "진행 중…"}</button></section></div>}
              {activeMessenger && openedMessengerBlockId !== activeMessenger.id && <button className="maker-playtest-messenger-popup maker-messenger-popup" type="button" onClick={() => { setMessengerLineIndex(0); setTypedMessengerText(""); setOpenedMessengerBlockId(activeMessenger.id); }}><span>{activeMessenger.sender || "DROPLINK"}</span><strong>{activeMessenger.notification || "새로운 메시지가 도착했습니다."}</strong><em>지금</em></button>}
              {activeMessenger && openedMessengerBlockId === activeMessenger.id && <div className="maker-playtest-messenger-dialog is-simple" role="dialog" aria-modal="true" aria-label={`${activeMessenger.sender || "DROPLINK"} 대화`} onClick={advanceMessengerDialogue}><section><header><span>{activeMessenger.sender || "DROPLINK"}</span></header><div><p>{typedMessengerText}<i aria-hidden="true" /></p></div></section></div>}
              {activeEvidenceItem && <div className="maker-evidence-acquisition-modal" role="dialog" aria-modal="true" aria-label="증거물 획득"><section><span>증거물 획득</span><h2>새 증거물을 확보했습니다.</h2><article>{activeEvidenceItem.asset && activeEvidenceItem.assetType === "image" ? <Image src={activeEvidenceItem.asset} alt={activeEvidenceItem.name} width={280} height={210} unoptimized /> : <i>3D</i>}<strong>{activeEvidenceItem.name}</strong></article><button type="button" onClick={closeEvidenceModal}>{evidenceModalItems && evidenceModalIndex < evidenceModalItems.length - 1 ? "다음 증거물" : "확인"}</button></section></div>}
              {notice && <p className={`maker-game-notice ${mechanicReady ? "is-success" : ""}`}>{notice}</p>}
            </div>
          </div>
          {scene.endingMode !== "none" && scene.endingMode !== "messenger" && scene.endingMode !== "submission" && <button className="maker-game-next maker-playtest-next" type="button" onClick={nextChapter}>{sceneIndex === draft.scenes.length - 1 ? "체험 완료" : "다음 챕터"}<span aria-hidden="true">→</span></button>}
        </div> : <section className="maker-playtest-finish"><div className="maker-editor-kicker"><span>FINISH</span> PLAYTEST COMPLETE</div><h1>전체 게임 흐름을 체험했어요.</h1><p>챕터마다 기믹과 내용이 배치한 순서대로 진행되는지 확인해 보세요.</p><div className="maker-playtime-setting"><div><span>예상 플레이 시간</span><strong>{totalMinutes + 5}분</strong><small>기믹 예상 시간 {totalMinutes}분 + 준비·전환 5분</small></div></div><div className="maker-playtest-finish-actions"><button type="button" onClick={() => openScene(0)}>처음부터 다시 체험</button><Link className="maker-primary-button" href="/maker/chapter">챕터 설정으로 돌아가기</Link></div></section>}
      </section>
    </div>
  </main>;
}
