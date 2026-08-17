import { RestAPI } from "@webpack/common";

export const enrollQuest = (questId: string, location: number = 0) =>
    RestAPI.post({ url: `/quests/${questId}/enroll`, body: { location } });

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const isNonRetryable = (e: any): boolean => {
    const status = e?.status ?? e?.httpStatus ?? e?.body?.code;
    return status === 404 || status === 401 || status === 403;
};

export const claimQuest = async (questId: string) => {
    const endpoints = ["/claim-reward", "/claim"];
    for (const endpoint of endpoints) {
        for (const platform of [0, 1, 2]) {
            try {
                return await RestAPI.post({ url: `/quests/${questId}${endpoint}`, body: { platform } });
            } catch (e) {
                if (isNonRetryable(e)) throw e;
                await delay(1500);
            }
        }
    }
    throw new Error("Failed to claim on all platforms");
};

export const sendVideoProgress = (questId: string, timestamp: number) =>
    RestAPI.post({ url: `/quests/${questId}/video-progress`, body: { timestamp } });

export const sendHeartbeat = (questId: string, streamKey: string, terminal: boolean) =>
    RestAPI.post({ url: `/quests/${questId}/heartbeat`, body: { stream_key: streamKey, terminal } });

export const fetchPublicApplications = (applicationId: string) =>
    RestAPI.get({ url: `/applications/public?application_ids=${applicationId}` });
