import { FluxDispatcher } from "@webpack/common";

import { fakeApplications, fakeGames } from "../state";
import { ApplicationStreamingStore, RunningGameStore } from "../stores";

function ensureGameStorePatched() {
    if ((RunningGameStore as any)._originalGetRunningGames) return;

    (RunningGameStore as any)._originalGetRunningGames = RunningGameStore.getRunningGames;
    (RunningGameStore as any)._originalGetGameForPID = RunningGameStore.getGameForPID;

    RunningGameStore.getRunningGames = () =>
        fakeGames.size > 0
            ? Array.from(fakeGames.values())
            : (RunningGameStore as any)._originalGetRunningGames.call(RunningGameStore);

    RunningGameStore.getGameForPID = (p: number) => {
        if (fakeGames.size > 0) {
            const found = Array.from(fakeGames.values()).find(g => g.pid === p);
            if (found) return found;
        }
        return (RunningGameStore as any)._originalGetGameForPID.call(RunningGameStore, p);
    };
}

function restoreGameStoreIfEmpty() {
    if (fakeGames.size > 0) return;
    if (!(RunningGameStore as any)._originalGetRunningGames) return;

    RunningGameStore.getRunningGames = (RunningGameStore as any)._originalGetRunningGames;
    RunningGameStore.getGameForPID = (RunningGameStore as any)._originalGetGameForPID;
    delete (RunningGameStore as any)._originalGetRunningGames;
    delete (RunningGameStore as any)._originalGetGameForPID;
}

export function injectFakeGame(questId: string, fakeGame: any) {
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

export function injectFakeApp(questId: string, fakeApp: any) {
    fakeApplications.set(questId, fakeApp);

    if (!(ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata) {
        (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata =
            ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    }

    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () =>
        fakeApplications.size > 0
            ? Array.from(fakeApplications.values())[0]
            : (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata.call(ApplicationStreamingStore);
}

export function removeFakeApp(questId: string) {
    fakeApplications.delete(questId);

    if (fakeApplications.size === 0 && (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata) {
        ApplicationStreamingStore.getStreamerActiveStreamMetadata =
            (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
        delete (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
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
        if ((ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata) {
            ApplicationStreamingStore.getStreamerActiveStreamMetadata =
                (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
            delete (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
        }
    }
}
