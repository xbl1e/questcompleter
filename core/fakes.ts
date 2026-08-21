import { FluxDispatcher } from "@webpack/common";

import { fakeApplications, fakeGames } from "../state";
import { ApplicationStreamingStore, RunningGameStore } from "../stores";
import type { FakeApplication, FakeGame } from "../types/models";

function ensureGameStorePatched() {
    if (RunningGameStore._originalGetRunningGames) return;

    RunningGameStore._originalGetRunningGames = RunningGameStore.getRunningGames;
    RunningGameStore._originalGetGameForPID = RunningGameStore.getGameForPID;

    RunningGameStore.getRunningGames = () =>
        fakeGames.size > 0
            ? Array.from(fakeGames.values())
            : (RunningGameStore._originalGetRunningGames?.call(RunningGameStore) ?? []);

    RunningGameStore.getGameForPID = (p: number) => {
        if (fakeGames.size > 0) {
            const found = Array.from(fakeGames.values()).find(g => g.pid === p);
            if (found) return found;
        }
        return RunningGameStore._originalGetGameForPID?.call(RunningGameStore, p);
    };
}

function restoreGameStoreIfEmpty() {
    if (fakeGames.size > 0) return;
    if (!RunningGameStore._originalGetRunningGames) return;

    if (RunningGameStore._originalGetRunningGames) {
        RunningGameStore.getRunningGames = RunningGameStore._originalGetRunningGames;
    }
    if (RunningGameStore._originalGetGameForPID) {
        RunningGameStore.getGameForPID = RunningGameStore._originalGetGameForPID;
    }
    delete RunningGameStore._originalGetRunningGames;
    delete RunningGameStore._originalGetGameForPID;
}

export function injectFakeGame(questId: string, fakeGame: FakeGame) {
    const realGames = fakeGames.size === 0 ? RunningGameStore.getRunningGames() : [];
    fakeGames.set(questId, fakeGame);
    ensureGameStorePatched();

    FluxDispatcher.dispatch({
        type: "RUNNING_GAMES_CHANGE",
        removed: realGames,
        added: [fakeGame],
        games: Array.from(fakeGames.values()),
    });
}

export function removeFakeGame(questId: string) {
    const fakeGame = fakeGames.get(questId);
    if (!fakeGame) return;

    fakeGames.delete(questId);
    restoreGameStoreIfEmpty();

    const games = RunningGameStore.getRunningGames();
    FluxDispatcher.dispatch({
        type: "RUNNING_GAMES_CHANGE",
        removed: [fakeGame],
        added: fakeGames.size === 0 ? games : [],
        games,
    });
}

export function injectFakeApp(questId: string, fakeApp: FakeApplication) {
    fakeApplications.set(questId, fakeApp);

    if (!ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata) {
        ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata =
            ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    }

    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () =>
        fakeApplications.size > 0
            ? Array.from(fakeApplications.values())[0]
            : ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata?.call(ApplicationStreamingStore);
}

export function removeFakeApp(questId: string) {
    fakeApplications.delete(questId);

    if (fakeApplications.size === 0 && ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata) {
        ApplicationStreamingStore.getStreamerActiveStreamMetadata =
            ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata;
        delete ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata;
    }
}

export function removeAllFakes() {
    if (fakeGames.size > 0) {
        const removed = Array.from(fakeGames.values());
        fakeGames.clear();
        restoreGameStoreIfEmpty();
        const games = RunningGameStore.getRunningGames();
        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed, added: games, games });
    }

    if (fakeApplications.size > 0) {
        fakeApplications.clear();
        if (ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata) {
            ApplicationStreamingStore.getStreamerActiveStreamMetadata =
                ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata;
            delete ApplicationStreamingStore._originalGetStreamerActiveStreamMetadata;
        }
    }
}
