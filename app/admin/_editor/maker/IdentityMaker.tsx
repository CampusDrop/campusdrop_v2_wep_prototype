"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { cloneDefaultDraft, gameThemes, gameTones, getAutomaticCaseNumber, toneColorRecommendations, themeIdentityDefaults, type GameColors, type GameDraft } from "./gameDraft";
import { loadMakerDraft, saveMakerDraft } from "./draftStorage";

const colorRoles: Array<{ key: keyof GameColors; label: string; detail: string }> = [
  { key: "primary", label: "핵심 색", detail: "주요 행동과 가장 중요한 상태" },
  { key: "secondary", label: "서브 색", detail: "보조 UI와 레이어" },
  { key: "special", label: "특별 색", detail: "보상·단서·강조 요소" },
  { key: "text", label: "글자 색", detail: "기본 텍스트와 제목" },
  { key: "background", label: "배경 색", detail: "기본 화면 바탕" },
  { key: "forbidden", label: "금지 색", detail: "이 게임에서 쓰지 않을 색" },
];

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export default function IdentityMakerPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<GameDraft>(cloneDefaultDraft);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    window.queueMicrotask(() => {
      if (isActive) setDraft(loadMakerDraft());
    });
    return () => { isActive = false; };
  }, []);
  const automaticCaseNumber = getAutomaticCaseNumber(draft.title, draft.theme);
  const recommendation = toneColorRecommendations[draft.tone];
  const livePreviewStyle = {
    "--identity-primary": isHexColor(draft.colors.primary) ? draft.colors.primary : recommendation.primary,
    "--identity-secondary": isHexColor(draft.colors.secondary) ? draft.colors.secondary : recommendation.secondary,
    "--identity-special": isHexColor(draft.colors.special) ? draft.colors.special : recommendation.special,
    "--identity-text": isHexColor(draft.colors.text) ? draft.colors.text : recommendation.text,
    "--identity-background": isHexColor(draft.colors.background) ? draft.colors.background : recommendation.background,
  } as CSSProperties;
  const selectedTheme = gameThemes.find((theme) => theme.id === draft.theme);
  const selectedTone = gameTones.find((tone) => tone.id === draft.tone);

  function updateDraft(patch: Partial<GameDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSavedAt(null);
  }

  function updateColor(key: keyof GameColors, value: string) {
    setDraft((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));
    setSavedAt(null);
  }

  function applyTheme(theme: GameDraft["theme"]) {
    const defaults = themeIdentityDefaults[theme];
    updateDraft({
      theme,
      tone: defaults.tone,
      accent: defaults.accent,
      colors: { ...toneColorRecommendations[defaults.tone] },
    });
  }

  function applyTone(tone: GameDraft["tone"], accent: GameDraft["accent"]) {
    updateDraft({ tone, accent, colors: { ...toneColorRecommendations[tone] } });
  }

  function applyRecommendedPalette() {
    updateDraft({ colors: { ...recommendation } });
  }

  function continueToChapters() {
    saveMakerDraft(draft);
    router.push("/admin/editor/maker/chapter");
  }

  function loadGiraffeDraft() {
    if (!window.confirm("현재 이 기기에 저장된 초안을 기린 방탈출 기본 초안으로 바꿀까요?")) return;
    const nextDraft = cloneDefaultDraft();
    setDraft(nextDraft);
    saveMakerDraft(nextDraft);
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <main className="maker-app maker-identity-page">
      <header className="maker-topbar">
        <Link className="maker-brand" href="/"><Image src="/campusdrop_logo.png" alt="Campus Drop" width={36} height={36} priority unoptimized /><span>Maker</span></Link>
        <nav className="maker-step-nav" aria-label="Maker 단계"><strong>1. Game identity</strong><span>2. Chapters</span><span>3. Playtest</span></nav>
        <div className="maker-topbar-actions"><span>{savedAt ? `${savedAt}에 이 기기에 저장됨` : "이 기기의 초안을 편집 중"}</span><button className="maker-secondary-button" type="button" onClick={loadGiraffeDraft}>기린 기본 초안 불러오기</button><button className="maker-primary-button" type="button" onClick={continueToChapters}>챕터 설정 계속하기</button></div>
      </header>

      <div className="maker-identity-shell">
        <section className="maker-identity-hero"><p>STEP 1 OF 3</p><h1>어떤 세계를<br />만들지 알려주세요.</h1><span>제목, 테마, 톤, 색 시스템이 게임의 첫인상을 만듭니다.</span></section>

        <section className="maker-identity-section" aria-labelledby="identity-title">
          <div className="maker-editor-kicker"><span>01</span> GAME IDENTITY</div>
          <h2 id="identity-title">게임의 첫 문장을 만드세요.</h2>
          <div className="maker-identity-grid">
            <label className="maker-title-field"><span>게임 제목</span><input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} /></label>
            <div className="maker-auto-field"><span>게임 번호</span><strong>{automaticCaseNumber}</strong><small>테마와 제목을 바탕으로 자동 발급됩니다.</small></div>
            <label className="maker-summary-field maker-wide-field"><span>한 줄 소개</span><textarea value={draft.summary} rows={3} onChange={(event) => updateDraft({ summary: event.target.value })} /></label>
            <div className="maker-field-group maker-wide-field"><span>게임 테마</span><div className="maker-theme-picker">{gameThemes.map((theme) => <button className={draft.theme === theme.id ? "is-selected" : ""} key={theme.id} type="button" onClick={() => applyTheme(theme.id)}><strong>{theme.label}</strong><small>{theme.description}</small></button>)}</div><p className="maker-auto-apply-note">테마를 바꾸면 어울리는 기본 게임 톤이 자동 적용됩니다.</p></div>
            <div className="maker-field-group maker-wide-field"><span>게임 톤</span><div className="maker-tone-picker">{gameTones.map((tone) => <button className={draft.tone === tone.id ? `is-selected is-${tone.accent}` : `is-${tone.accent}`} key={tone.id} type="button" onClick={() => applyTone(tone.id, tone.accent)}><i /><strong>{tone.label}</strong><small>{tone.detail}</small></button>)}</div><p className="maker-auto-apply-note">게임 톤을 고르면 어울리는 추천 색코드가 함께 적용됩니다.</p></div>
          </div>
        </section>

        <section className="maker-identity-live-section" aria-labelledby="identity-preview-title">
          <div className="maker-identity-preview-heading">
            <div><div className="maker-editor-kicker"><span>PREVIEW</span> PLAYER INTRO</div><h2 id="identity-preview-title">플레이어에게는 이렇게 보여요.</h2><p>입력한 게임 정보와 색 규칙이 바로 반영됩니다.</p></div>
            <span>LIVE</span>
          </div>
          <div className="maker-identity-live-preview" style={livePreviewStyle}>
            <div className="maker-identity-preview-top"><strong>CAMPUS DROP</strong><span>{automaticCaseNumber}</span></div>
            <div className="maker-identity-preview-orbit maker-identity-preview-orbit-one" /><div className="maker-identity-preview-orbit maker-identity-preview-orbit-two" />
            <div className="maker-identity-preview-copy"><em>{selectedTheme?.label} · {selectedTone?.label}</em><h3>{draft.title || "아직 이름 없는 게임"}</h3><p>{draft.summary || "이곳에 게임의 한 줄 소개가 나타납니다."}</p></div>
            <div className="maker-identity-preview-bottom"><span>챕터 설정 후 플레이 시간이 안내됩니다.</span><button type="button" tabIndex={-1}>게임 시작 <i aria-hidden="true">→</i></button></div>
          </div>
        </section>

        <section className="maker-identity-section maker-color-section" aria-labelledby="color-title">
          <div className="maker-color-heading"><div><div className="maker-editor-kicker"><span>02</span> COLOR SYSTEM</div><h2 id="color-title">이 게임만의 색 규칙을 정하세요.</h2><p><b>{selectedTone?.label}</b> 톤에 맞는 추천 팔레트가 준비되어 있습니다.</p></div><button className="maker-secondary-button" type="button" onClick={applyRecommendedPalette}>톤 추천 색코드 적용</button></div>
          <div className="maker-palette-preview" aria-label="현재 색 팔레트">{colorRoles.map((role) => <i key={role.key} style={{ background: isHexColor(draft.colors[role.key]) ? draft.colors[role.key] : "#d9dfda" }} />)}</div>
          <div className="maker-color-grid">
            {colorRoles.map((role) => {
              const value = draft.colors[role.key];
              const recommended = recommendation[role.key];
              return <article key={role.key}><div><span>{role.label}</span><small>{role.detail}</small></div><div className="maker-color-input"><input aria-label={`${role.label} 색상 선택`} type="color" value={isHexColor(value) ? value : "#000000"} onChange={(event) => updateColor(role.key, event.target.value.toUpperCase())} /><input aria-label={`${role.label} 색코드`} value={value} onChange={(event) => updateColor(role.key, event.target.value.toUpperCase())} /><button type="button" onClick={() => updateColor(role.key, recommended)} title={`${recommended} 적용`}>추천</button></div><em>추천 {recommended}</em></article>;
            })}
          </div>
        </section>

        <footer className="maker-identity-footer"><div><span>다음 단계</span><strong>챕터별 연출과 플레이 방식 설정</strong></div><button className="maker-primary-button" type="button" onClick={continueToChapters}>챕터 설정 계속하기 <i aria-hidden="true">→</i></button></footer>
      </div>
    </main>
  );
}
