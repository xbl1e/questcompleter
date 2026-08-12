export const completingQuest = new Map<string, boolean>();
export const fakeGames = new Map<string, any>();
export const fakeApplications = new Map<string, any>();
export const questStartTimes = new Map<string, { startedAt: number; lastProgress: number; }>();

export const questProgress = new Map<string, {
    questName: string;
    gameName: string;
    taskName: string;
    secondsDone: number;
    secondsNeeded: number;
    status: "idle" | "running" | "completed" | "error";
}>();

export const progressListeners = new Set<() => void>();

export function updateProgress(questId: string, update: Partial<typeof questProgress extends Map<string, infer V> ? V : never>) {
    const existing = questProgress.get(questId) || {} as any;
    questProgress.set(questId, { ...existing, ...update });
    progressListeners.forEach(listener => listener());
}
