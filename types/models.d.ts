export interface FakeGame {
    id: string;
    name: string;
    pid: number;
    cmdLine?: string;
    execName?: string;
    isLauncher?: boolean;
}

export interface FakeApplication {
    id: string;
    name: string;
}

export interface FluxEvent {
    type: string;
    [key: string]: unknown;
}

export interface HeartbeatEvent extends FluxEvent {
    questId: string;
    userStatus: {
        streamProgressSeconds: number;
        progress: Record<string, { value: number }>;
    };
}

export interface Channel {
    id: string;
    type: number;
    guild_id?: string;
    name?: string;
}
