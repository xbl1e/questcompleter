import settings from "../settings";
import { completingQuest, questStartTimes, updateProgress } from "../state";

import { stopAllFarming } from "./manager";
import { dispatch, resolveTask } from "./tasks";

export function completeQuest(quest: QuestValue) {
    if (!settings.store.hasAcceptedToUsePlugin) {
        stopAllFarming();
        return;
    }

    if (!quest) return;

    const task = resolveTask(quest);
    if (!task) {
        if (!completingQuest.get(quest.id)) {
            completingQuest.set(quest.id, true);
        }
        return;
    }

    completingQuest.set(quest.id, true);
    questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: task.secondsDone });

    updateProgress(quest.id, {
        questName: quest.config?.messages?.questName ?? "Unknown Quest",
        gameName: task.applicationName,
        taskName: task.taskName,
        secondsDone: task.secondsDone,
        secondsNeeded: task.secondsNeeded,
        status: "running",
    });

    dispatch(quest, task).then(completed => {
        completingQuest.set(quest.id, false);
        if (completed) {
            updateProgress(quest.id, { secondsDone: task.secondsNeeded, status: "completed" });
        } else {
            updateProgress(quest.id, { status: "idle" });
        }
    });
}

