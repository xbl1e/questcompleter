import { sendVideoProgress } from "../../api";
import { completingQuest, questStartTimes, updateProgress } from "../../state";
import { sleep } from "../utils";

const MAX_FUTURE_SECONDS = 10;
const STEP_SECONDS = 10;

export async function farmVideo(quest: QuestValue) {
    const taskName = quest.config?.taskConfig?.tasks?.WATCH_VIDEO
        ? "WATCH_VIDEO"
        : "WATCH_VIDEO_ON_MOBILE";

    const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2;
    const secondsNeeded = taskConfig!.tasks[taskName].target;
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    const enrolledAt = new Date(quest.userStatus?.enrolledAt ?? Date.now()).getTime();

    while (true) {
        if (!completingQuest.get(quest.id)) {
            updateProgress(quest.id, { status: "idle" });
            return;
        }

        const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + MAX_FUTURE_SECONDS;
        const diff = maxAllowed - secondsDone;
        const step = diff > STEP_SECONDS ? diff : STEP_SECONDS;
        const timestamp = secondsDone + step;

        if (diff >= STEP_SECONDS || timestamp >= secondsNeeded) {
            const postTimestamp = Math.min(secondsNeeded, timestamp + (timestamp < secondsNeeded ? Math.random() : 0));
            const res = await sendVideoProgress(quest.id, postTimestamp).catch(() => null);

            if (res) {
                secondsDone = Math.min(secondsNeeded, timestamp);
                updateProgress(quest.id, { secondsDone });
                questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: secondsDone });

                if (res.body?.completed_at != null || secondsDone >= secondsNeeded) {
                    return true;
                }
            }
        }

        if (timestamp >= secondsNeeded) break;
        await sleep(1000);
    }

    await sendVideoProgress(quest.id, secondsNeeded).catch(() => null);

    return true;
}
