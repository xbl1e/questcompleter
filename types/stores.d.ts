import type { Channel, FakeApplication, FakeGame } from "./models";

export interface ApplicationStreamingStore {
    getStreamerActiveStreamMetadata: () => FakeApplication | undefined;
    _originalGetStreamerActiveStreamMetadata?: () => FakeApplication | undefined;
}

export interface RunningGameStore {
    getRunningGames: () => FakeGame[];
    getGameForPID: (pid: number) => FakeGame | undefined;
    _originalGetRunningGames?: () => FakeGame[];
    _originalGetGameForPID?: (pid: number) => FakeGame | undefined;
}

export type QuestsStore = {
    addChangeListener: (listener: () => void) => void;
    removeChangeListener: (listener: () => void) => void;
    quests: Map<string, QuestValue>;
};

export interface ChannelStore {
    getChannel: (id: string) => Channel | undefined;
    hasChannel: (id: string) => boolean;
}

export type GuildChannelStore = {
    getAllGuilds(): Map<string, GuildData>;
};
