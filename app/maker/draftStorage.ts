import { cloneDefaultDraft, getDefaultMechanicConfig, toneColorRecommendations, type GameDraft, type MakerScene } from "./gameDraft";

export const makerDraftStorageKey = "campus-drop-maker-draft-v1";

const retiredArMechanics: Record<string, "image-scan" | "ar-treasure"> = {
  "ar-clue": "ar-treasure",
  "ar-assembly": "ar-treasure",
  "checkpoint-tag": "image-scan",
};

function migrateRetiredArMechanic(scene: MakerScene): MakerScene {
  const retiredMechanic = retiredArMechanics[scene.mechanicType ?? ""];
  if (!retiredMechanic) {
    if (scene.mechanicType !== "image-scan" && scene.mechanicType !== "ar-treasure") return scene;
    return { ...scene, mechanicConfig: { ...getDefaultMechanicConfig(scene.mechanicType), ...(scene.mechanicConfig ?? {}) } };
  }
  const config = scene.mechanicConfig ?? {};
  if (retiredMechanic === "image-scan") {
    return { ...scene, mechanic: "이미지 인식", mechanicType: "image-scan", mechanicConfig: { ...getDefaultMechanicConfig("image-scan"), ...config, targetDescription: config.targetDescription ?? config.tagName ?? "현장 이미지", actionLabel: config.actionLabel ?? "이미지 인식 시작" } };
  }
  return { ...scene, mechanic: "AR 보물찾기", mechanicType: "ar-treasure", mechanicConfig: { ...getDefaultMechanicConfig("ar-treasure"), ...config, treasureName: config.treasureName ?? config.objectName ?? config.clueName ?? "숨은 보물", actionLabel: config.actionLabel ?? "바닥에서 보물 찾기" } };
}

function migrateChapterRecords<T>(records: Record<string, T> | undefined, scenes: MakerScene[]) {
  if (!records) return {};
  const migrated: Record<string, T> = {};
  const claimedLegacyChapters = new Set<string>();
  for (const scene of scenes) {
    if (records[scene.id] !== undefined) {
      migrated[scene.id] = records[scene.id];
    } else if (scene.chapter && records[scene.chapter] !== undefined && !claimedLegacyChapters.has(scene.chapter)) {
      migrated[scene.id] = records[scene.chapter];
      claimedLegacyChapters.add(scene.chapter);
    }
  }
  return migrated;
}

export function loadMakerDraft(): GameDraft {
  if (typeof window === "undefined") return cloneDefaultDraft();
  const stored = window.localStorage.getItem(makerDraftStorageKey);
  if (!stored) return cloneDefaultDraft();
  try {
    const draft = JSON.parse(stored) as Partial<GameDraft>;
    if (!draft.scenes?.length) return cloneDefaultDraft();
    const fallback = cloneDefaultDraft();
    const theme = draft.theme ?? fallback.theme;
    return {
      ...fallback,
      ...draft,
      theme,
      tone: draft.tone ?? fallback.tone,
      colors: draft.colors ?? toneColorRecommendations[draft.tone ?? fallback.tone],
      chapterEvidence: migrateChapterRecords(draft.chapterEvidence, draft.scenes),
      chapterEvidenceEnabled: {
        ...migrateChapterRecords(draft.chapterEvidenceEnabled, draft.scenes),
        ...Object.fromEntries(draft.scenes.filter((scene) => (scene.endingMode as string) === "evidence").map((scene) => [scene.id, true])),
      },
      scenes: draft.scenes.map((scene) => {
        const migratedScene = migrateRetiredArMechanic(scene);
        return (migratedScene.endingMode as string) === "evidence" ? { ...migratedScene, endingMode: "none" } : migratedScene;
      }),
    } as GameDraft;
  } catch {
    window.localStorage.removeItem(makerDraftStorageKey);
    return cloneDefaultDraft();
  }
}

export function saveMakerDraft(draft: GameDraft) {
  window.localStorage.setItem(makerDraftStorageKey, JSON.stringify(draft));
}
