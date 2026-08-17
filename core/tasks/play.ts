import { FluxDispatcher } from "@webpack/common";

import { fetchPublicApplications } from "../../api";
import { completingQuest, questStartTimes, updateProgress } from "../../state";
import { injectFakeGame, removeFakeGame } from "../fakes";

export async function farmPlay(quest: QuestValue, applicationId: string, applicationName: string, secondsNeeded: number) {
    const pid = Math.floor(Math.random() * 30000) + 1000;

    const res = await fetchPublicApplications(applicationId).catch(() => null);
    
    const appData = res?.body?.[0] ?? {
        name: applicationName !== "Unknown Game" ? applicationName : "MockGame",
        executables: [{ os: "win32", name: "mockgame.exe" }],
    };

    const exeName = appData.executables?.find((x: any) => x.os === "win32")?.name?.replace(">", "")
        ?? appData.name.replace(/[/\\:*?"<>|]/g, "") + ".exe";

    const fakeGame = {
        cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
        exeName,
        exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
        hidden: false,
        isLauncher: false,
        id: applicationId,
        name: appData.name,
        pid,
        pidPath: [pid],
        processName: appData.name,
        start: Date.now(),
        distributor: null,
        lastFocused: Date.now(),
        lastLaunched: Date.now(),
        nativeProcessObserverId: 0,
    };

    injectFakeGame(quest.id, fakeGame);

    return new Promise<boolean>(resolve => {
        const handler = (event: any) => {
            if (event.questId !== quest.id) return;

            const progress = quest.config.configVersion === 1
                ? event.userStatus.streamProgressSeconds
                : Math.floor(event.userStatus.progress.PLAY_ON_DESKTOP.value);

            updateProgress(quest.id, { secondsDone: progress });
            questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: progress });

            if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                removeFakeGame(quest.id);
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                resolve(progress >= secondsNeeded);
            }
        };

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
    });
}
