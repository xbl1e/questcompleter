import { FluxDispatcher } from "@webpack/common";

import { completingQuest, questStartTimes, updateProgress } from "../../state";
import { injectFakeApp, removeFakeApp } from "../fakes";

export async function farmStream(quest: QuestValue, applicationId: string, applicationName: string, secondsNeeded: number) {
    const pid = Math.floor(Math.random() * 30000) + 1000;

    const fakeApp = {
        id: applicationId,
        name: `FakeApp ${applicationName} (CompleteDiscordQuest)`,
        pid,
        sourceName: null,
    };

    injectFakeApp(quest.id, fakeApp);

    return new Promise<boolean>(resolve => {
        const handler = (event: any) => {
            if (event.questId !== quest.id) return;

            const progress = quest.config.configVersion === 1
                ? event.userStatus.streamProgressSeconds
                : Math.floor(event.userStatus.progress.STREAM_ON_DESKTOP.value);

            updateProgress(quest.id, { secondsDone: progress });
            questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: progress });

            if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                removeFakeApp(quest.id);
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                resolve(progress >= secondsNeeded);
            }
        };

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
    });
}
