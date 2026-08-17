import { farmActivity } from "./activity";
import { farmPlay } from "./play";
import { farmStream } from "./stream";
import { farmVideo } from "./video";

const TASK_NAMES = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"] as const;
type TaskName = typeof TASK_NAMES[number];

interface ResolvedTask {
    taskName: TaskName;
    applicationId: string;
    applicationName: string;
    secondsNeeded: number;
    secondsDone: number;
}

export function resolveTask(quest: QuestValue): ResolvedTask | null {
    const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2;
    if (!taskConfig?.tasks) return null;

    const taskName = TASK_NAMES.find(name => taskConfig.tasks[name] != null);
    if (!taskName) return null;

    const taskApp = taskConfig.tasks[taskName].applications?.[0];
    const applicationId = quest.config?.application?.id || quest.config?.applicationId || taskApp?.id || "0";
    const applicationName = quest.config?.application?.name || quest.config?.applicationName || taskApp?.name || quest.config?.messages?.questName || "Unknown Game";
    const secondsNeeded = taskConfig.tasks[taskName].target;
    const secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

    return { taskName, applicationId, applicationName, secondsNeeded, secondsDone };
}

export async function dispatch(quest: QuestValue, task: ResolvedTask): Promise<boolean> {
    const isApp = typeof DiscordNative !== "undefined";

    if (!isApp && task.taskName !== "WATCH_VIDEO" && task.taskName !== "WATCH_VIDEO_ON_MOBILE") {
        return false;
    }

    switch (task.taskName) {
        case "WATCH_VIDEO":
        case "WATCH_VIDEO_ON_MOBILE":
            return (await farmVideo(quest)) ?? false;

        case "PLAY_ON_DESKTOP":
            return farmPlay(quest, task.applicationId, task.applicationName, task.secondsNeeded);

        case "STREAM_ON_DESKTOP":
            return farmStream(quest, task.applicationId, task.applicationName, task.secondsNeeded);

        case "PLAY_ACTIVITY":
            return farmActivity(quest, task.secondsNeeded);

        default:
            return false;
    }
}
