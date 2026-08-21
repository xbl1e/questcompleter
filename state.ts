import type { FakeApplication, FakeGame } from "./types/models";

export interface QuestProgress {
    questName: string;
    gameName: string;
    taskName: string;
    secondsDone: number;
    secondsNeeded: number;
    status: "idle" | "running" | "completed" | "error";
}

export const completingQuest = new Map<string, boolean>();
export const fakeGames = new Map<string, FakeGame>();
export const fakeApplications = new Map<string, FakeApplication>();
export const questStartTimes = new Map<string, { startedAt: number; lastProgress: number }>();
export const questProgress = new Map<string, QuestProgress>();

const progressListeners = new Set<() => void>();

export function subscribeProgress(listener: () => void): () => void {
    progressListeners.add(listener);
    return () => { progressListeners.delete(listener); };
}

function notifyListeners() {
    progressListeners.forEach(fn => fn());
}

export function updateProgress(questId: string, update: Partial<QuestProgress>) {
    const existing = questProgress.get(questId) ?? {} as QuestProgress;
    questProgress.set(questId, { ...existing, ...update });
    notifyListeners();
}

export function removeProgress(questId: string) {
    questProgress.delete(questId);
    notifyListeners();
}
