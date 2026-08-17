import { sendHeartbeat } from "../../api";
import { completingQuest, updateProgress } from "../../state";
import { ChannelStore, GuildChannelStore } from "../../stores";
import { sleep } from "../utils";

const HEARTBEAT_INTERVAL_MS = 20_000;

function resolveStreamKey(): string | undefined {
    const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id
        ?? Object.values(GuildChannelStore.getAllGuilds())
            .find((x: any) => x?.VOCAL?.length > 0)?.VOCAL?.[0]?.channel?.id;

    return channelId ? `call:${channelId}:1` : undefined;
}

export async function farmActivity(quest: QuestValue, secondsNeeded: number): Promise<boolean> {
    const streamKey = resolveStreamKey();
    if (!streamKey) return false;

    while (true) {
        try {
            const res = await sendHeartbeat(quest.id, streamKey, false);
            const progress = res.body.progress.PLAY_ACTIVITY.value;
            updateProgress(quest.id, { secondsDone: progress });

            if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                if (progress >= secondsNeeded) {
                    await sendHeartbeat(quest.id, streamKey, true);
                    return true;
                }
                return false;
            }

            await sleep(HEARTBEAT_INTERVAL_MS);
        } catch {
            return false;
        }
    }
}
