import { FluxDispatcher } from "@webpack/common";

import { QuestApplyAction, QuestLocationMap } from "../api";
import settings from "../settings";
import { completingQuest, fakeApplications, fakeGames, questProgress, questStartTimes, updateProgress } from "../state";
import { QuestsStore, RunningGameStore } from "../stores";

import { completeQuest } from "./farmer";

const STALE_QUEST_TIMEOUT_MS = 60000;

export function isQuestEligibleForFarming(quest: QuestValue): boolean {
    const questConfig = quest.config?.taskConfig || quest.config?.taskConfigV2;
    if (!questConfig?.tasks) return false;
    
    if (!Object.keys(questConfig.tasks).some(taskName => {
        return (taskName === "WATCH_VIDEO" && settings.store.farmVideos)
            || (taskName === "WATCH_VIDEO_ON_MOBILE" && settings.store.farmVideos)
            || (taskName === "PLAY_ON_DESKTOP" && settings.store.farmPlayOnDesktop)
            || (taskName === "STREAM_ON_DESKTOP" && settings.store.farmStreamOnDesktop)
            || (taskName === "PLAY_ACTIVITY" && settings.store.farmPlayActivity);
    })) return false;

    const rewards = quest.config?.rewardsConfig?.rewards || [];
    if (!Array.isArray(rewards) || rewards.length === 0) return false;

    return rewards.some(reward => {
        return (reward.type === 1 && settings.store.farmRewardCodes)
            || (reward.type === 2 && settings.store.farmInGame)
            || (reward.type === 3 && settings.store.farmCollectibles)
            || (reward.type === 4 && settings.store.farmVirtualCurrency)
            || (reward.type === 5 && settings.store.farmFractionalPremium);
    });
}

function acceptQuest(quest: QuestValue) {
    if (!settings.store.acceptQuestsAutomatically) return;
    
    const action: QuestAction = {
        questContent: QuestLocationMap.QUEST_HOME_DESKTOP,
        questContentCTA: "ACCEPT_QUEST",
        sourceQuestContent: 0,
    };
    
    QuestApplyAction(quest.id, action).catch(() => {});
}

export function stopCompletingAll() {
    const completableQuests = Array.from(QuestsStore.quests.values()) as QuestValue[];
    const filteredQuests = completableQuests.filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && x.config?.expiresAt && new Date(x.config.expiresAt).getTime() > Date.now());

    for (const quest of filteredQuests) {
        if (completingQuest.has(quest.id)) {
            completingQuest.set(quest.id, false);
        }
    }
}

export function stopAllFarming() {
    stopCompletingAll();

    if (fakeGames.size > 0) {
        const removedGames = Array.from(fakeGames.values());
        fakeGames.clear();
        const games = RunningGameStore.getRunningGames();
        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: removedGames, added: games, games });
    }

    if (fakeApplications.size > 0) {
        fakeApplications.clear();
    }
}

export function updateQuests() {
    if (!settings.store.hasAcceptedToUsePlugin) {
        stopAllFarming();
        return;
    }

    const availableQuests = Array.from(QuestsStore.quests.values()) as QuestValue[];
    const acceptableQuests = availableQuests.filter(x => x.userStatus?.enrolledAt == null && x.config?.expiresAt && new Date(x.config.expiresAt).getTime() > Date.now());
    const completableQuests = availableQuests.filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && x.config?.expiresAt && new Date(x.config.expiresAt).getTime() > Date.now());
    
    for (const quest of acceptableQuests) {
        if (isQuestEligibleForFarming(quest)) {
            acceptQuest(quest);
        }
    }
    
    for (const quest of completableQuests) {
        if (completingQuest.has(quest.id)) {
            if (completingQuest.get(quest.id) === false) {
                completingQuest.delete(quest.id);
                questStartTimes.delete(quest.id);
            } else {
                const tracking = questStartTimes.get(quest.id);
                const progressEntry = questProgress.get(quest.id);
                if (tracking && progressEntry) {
                    const elapsed = Date.now() - tracking.startedAt;
                    if (elapsed > STALE_QUEST_TIMEOUT_MS && progressEntry.secondsDone <= tracking.lastProgress) {
                        fakeGames.delete(quest.id);
                        fakeApplications.delete(quest.id);
                        completingQuest.delete(quest.id);
                        questStartTimes.delete(quest.id);
                        
                        if (fakeGames.size === 0 && (RunningGameStore as any)._originalGetRunningGames) {
                            RunningGameStore.getRunningGames = (RunningGameStore as any)._originalGetRunningGames;
                            RunningGameStore.getGameForPID = (RunningGameStore as any)._originalGetGameForPID;
                            delete (RunningGameStore as any)._originalGetRunningGames;
                            delete (RunningGameStore as any)._originalGetGameForPID;
                        }
                        
                        updateProgress(quest.id, { status: "idle" });
                    }
                }
            }
        } else {
            completeQuest(quest);
        }
    }
}
