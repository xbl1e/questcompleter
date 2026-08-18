import { RestAPI } from "@webpack/common";

export const enrollQuest = (questId: string, location: number = 0) =>
    RestAPI.post({ url: `/quests/${questId}/enroll`, body: { location } });



export const sendVideoProgress = (questId: string, timestamp: number) =>
    RestAPI.post({ url: `/quests/${questId}/video-progress`, body: { timestamp } });

export const sendHeartbeat = (questId: string, streamKey: string, terminal: boolean) =>
    RestAPI.post({ url: `/quests/${questId}/heartbeat`, body: { stream_key: streamKey, terminal } });

export const fetchPublicApplications = (applicationId: string) =>
    RestAPI.get({ url: `/applications/public?application_ids=${applicationId}` });
