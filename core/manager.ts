import { enrollQuest } from "../api";
import settings from "../settings";
import { completingQuest, fakeApplications, fakeGames, questProgress, questStartTimes, removeProgress, updateProgress } from "../state";
import { QuestsStore } from "../stores";

import { removeAllFakes } from "./fakes";
import { completeQuest } from "./farmer";
import { jitteredDelay } from "./utils";

const STALE_TIMEOUT_MS = 60_000;
const enrolledAttempts = new Set<string>();

export function resetClaimState() {
    enrolledAttempts.clear();
}

function isExpired(quest: QuestValue): boolean {
    return !quest.config?.expiresAt || new Date(quest.config.expiresAt).getTime() <= Date.now();
}

function isEligibleTask(quest: QuestValue): boolean {
    const taskConfig = quest.config?.taskConfig || quest.config?.taskConfigV2;
    if (!taskConfig?.tasks) return false;

    return Object.keys(taskConfig.tasks).some(taskName =>
        (taskName === "WATCH_VIDEO" && settings.store.farmVideos)
        || (taskName === "WATCH_VIDEO_ON_MOBILE" && settings.store.farmVideos)
        || (taskName === "PLAY_ON_DESKTOP" && settings.store.farmPlayOnDesktop)
        || (taskName === "STREAM_ON_DESKTOP" && settings.store.farmStreamOnDesktop)
        || (taskName === "PLAY_ACTIVITY" && settings.store.farmPlayActivity)
    );
}

function isEligibleReward(quest: QuestValue): boolean {
    const rewards = quest.config?.rewardsConfig?.rewards;
    if (!Array.isArray(rewards) || rewards.length === 0) return false;

    return rewards.some(reward =>
        (reward.type === 1 && settings.store.farmRewardCodes)
        || (reward.type === 2 && settings.store.farmInGame)
        || (reward.type === 3 && settings.store.farmCollectibles)
        || (reward.type === 4 && settings.store.farmVirtualCurrency)
        || (reward.type === 5 && settings.store.farmFractionalPremium)
    );
}

export function isQuestEligibleForFarming(quest: QuestValue): boolean {
    return isEligibleTask(quest) && isEligibleReward(quest);
}

function isStale(questId: string): boolean {
    const tracking = questStartTimes.get(questId);
    const progress = questProgress.get(questId);
    if (!tracking || !progress) return false;

    return (Date.now() - tracking.startedAt > STALE_TIMEOUT_MS) && (progress.secondsDone <= tracking.lastProgress);
}

function cleanupStaleQuest(questId: string) {
    fakeGames.delete(questId);
    fakeApplications.delete(questId);
    completingQuest.delete(questId);
    questStartTimes.delete(questId);
    updateProgress(questId, { status: "idle" });
}

function purgeRemovedQuests(activeIds: Set<string>) {
    for (const questId of questProgress.keys()) {
        if (!activeIds.has(questId)) {
            fakeGames.delete(questId);
            fakeApplications.delete(questId);
            completingQuest.delete(questId);
            questStartTimes.delete(questId);
            enrolledAttempts.delete(questId);
            removeProgress(questId);
        }
    }
}

export function stopAllFarming() {
    const quests = Array.from(QuestsStore.quests.values()) as QuestValue[];
    for (const quest of quests) {
        if (completingQuest.has(quest.id)) {
            completingQuest.set(quest.id, false);
        }
    }

    resetClaimState();
    removeAllFakes();
}

export function updateQuests() {
    if (!settings.store.hasAcceptedToUsePlugin) {
        stopAllFarming();
        return;
    }

    const allQuests = Array.from(QuestsStore.quests.values()) as QuestValue[];
    purgeRemovedQuests(new Set(allQuests.map(q => q.id)));

    for (const quest of allQuests) {
        if (isExpired(quest)) continue;

        if (!quest.userStatus?.enrolledAt) {
            if (settings.store.acceptQuestsAutomatically && isQuestEligibleForFarming(quest) && !enrolledAttempts.has(quest.id)) {
                enrolledAttempts.add(quest.id);
                jitteredDelay(1000, 5000).then(() => enrollQuest(quest.id).catch(() => null));
            }
            continue;
        }

        if (quest.userStatus.completedAt) continue;

        if (completingQuest.has(quest.id)) {
            if (completingQuest.get(quest.id) === false) {
                completingQuest.delete(quest.id);
                questStartTimes.delete(quest.id);
            } else if (isStale(quest.id)) {
                cleanupStaleQuest(quest.id);
            }
        } else {
            completeQuest(quest);
        }
    }
}
