import { FluxDispatcher, RestAPI } from "@webpack/common";

import settings from "../settings";
import { completingQuest, fakeApplications, fakeGames, questStartTimes, updateProgress } from "../state";
import { ApplicationStreamingStore, ChannelStore, GuildChannelStore, RunningGameStore } from "../stores";

import { stopAllFarming } from "./manager";

export function completeQuest(quest: QuestValue) {
    if (!settings.store.hasAcceptedToUsePlugin) {
        stopAllFarming();
        return;
    }

    const isApp = typeof DiscordNative !== "undefined";
    if (!quest) return;

    const pid = Math.floor(Math.random() * 30000) + 1000;
    const taskConfig = quest.config?.taskConfig ?? quest.config?.taskConfigV2;
    
    if (!taskConfig?.tasks) return;
    
    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null);
    
    if (!taskName) {
        if (!completingQuest.get(quest.id)) {
            completingQuest.set(quest.id, true);
        }
        return;
    }

    const taskApp = taskConfig.tasks[taskName].applications?.[0];
    const applicationId = quest.config?.application?.id || quest.config?.applicationId || taskApp?.id || "0";
    const applicationName = quest.config?.application?.name || quest.config?.applicationName || taskApp?.name || quest.config?.messages?.questName || "Unknown Game";
    const questName = quest.config?.messages?.questName || "Unknown Quest";
    const secondsNeeded = taskConfig.tasks[taskName].target;
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

    if (!isApp && taskName !== "WATCH_VIDEO" && taskName !== "WATCH_VIDEO_ON_MOBILE") {
        return;
    }

    completingQuest.set(quest.id, true);
    questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: secondsDone });
    
    updateProgress(quest.id, {
        questName,
        gameName: applicationName,
        taskName,
        secondsDone,
        secondsNeeded,
        status: "running"
    });

    switch (taskName) {
        case "WATCH_VIDEO":
        case "WATCH_VIDEO_ON_MOBILE": {
            const maxFuture = 10, speed = 7, interval = 1;
            const enrolledAt = new Date(quest.userStatus.enrolledAt!).getTime();
            let completed = false;
            
            const watchVideo = async () => {
                while (true) {
                    const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
                    const diff = maxAllowed - secondsDone;
                    const timestamp = secondsDone + speed;

                    if (!completingQuest.get(quest.id)) {
                        completingQuest.set(quest.id, false);
                        updateProgress(quest.id, { status: "idle" });
                        break;
                    }

                    if (diff >= speed) {
                        try {
                            const res = await RestAPI.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) } });
                            completed = res.body.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);
                            updateProgress(quest.id, { secondsDone });
                        } catch {}
                    }

                    if (timestamp >= secondsNeeded) {
                        completingQuest.set(quest.id, false);
                        updateProgress(quest.id, { secondsDone: secondsNeeded, status: "completed" });
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, interval * 1000));
                }
                
                if (!completed) {
                    try {
                        await RestAPI.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
                    } catch {}
                }
                updateProgress(quest.id, { secondsDone: secondsNeeded, status: "completed" });
            };
            watchVideo();
            break;
        }

        case "PLAY_ON_DESKTOP": {
            RestAPI.get({ url: `/applications/public?application_ids=${applicationId}` }).then(res => {
                let appData = res.body?.[0];
                if (!appData) {
                    appData = {
                        name: applicationName !== "Unknown Game" ? applicationName : "MockGame",
                        executables: [{ os: "win32", name: "mockgame.exe" }]
                    };
                }
                
                const exeName = appData.executables?.find((x: any) => x.os === "win32")?.name?.replace(">","") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "") + ".exe";

                const fakeGame = {
                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                    exeName,
                    exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                    hidden: false,
                    isLauncher: false,
                    id: applicationId,
                    name: appData.name,
                    pid: pid,
                    pidPath: [pid],
                    processName: appData.name,
                    start: Date.now(),
                    distributor: null,
                    lastFocused: Date.now(),
                    lastLaunched: Date.now(),
                    nativeProcessObserverId: 0,
                };
                
                const realGames = fakeGames.size === 0 ? RunningGameStore.getRunningGames() : [];
                fakeGames.set(quest.id, fakeGame);
                const fakeGamesList = Array.from(fakeGames.values());
                
                if (!(RunningGameStore as any)._originalGetRunningGames) {
                    (RunningGameStore as any)._originalGetRunningGames = RunningGameStore.getRunningGames;
                    (RunningGameStore as any)._originalGetGameForPID = RunningGameStore.getGameForPID;
                }
                
                RunningGameStore.getRunningGames = () => {
                    return fakeGames.size > 0 ? Array.from(fakeGames.values()) : (RunningGameStore as any)._originalGetRunningGames.call(RunningGameStore);
                };
                
                RunningGameStore.getGameForPID = (p: number) => {
                    if (fakeGames.size > 0) {
                        const found = Array.from(fakeGames.values()).find(game => game.pid === p);
                        if (found) return found;
                    }
                    return (RunningGameStore as any)._originalGetGameForPID.call(RunningGameStore, p);
                };

                FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGamesList });

                const playOnDesktop = (event: any) => {
                    if (event.questId !== quest.id) return;
                    
                    const progress = quest.config.configVersion === 1 ? event.userStatus.streamProgressSeconds : Math.floor(event.userStatus.progress.PLAY_ON_DESKTOP.value);
                    updateProgress(quest.id, { secondsDone: progress });
                    questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: progress });

                    if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                        fakeGames.delete(quest.id);
                        
                        if (fakeGames.size === 0 && (RunningGameStore as any)._originalGetRunningGames) {
                            RunningGameStore.getRunningGames = (RunningGameStore as any)._originalGetRunningGames;
                            RunningGameStore.getGameForPID = (RunningGameStore as any)._originalGetGameForPID;
                            delete (RunningGameStore as any)._originalGetRunningGames;
                            delete (RunningGameStore as any)._originalGetGameForPID;
                        }
                        
                        const games = RunningGameStore.getRunningGames();
                        const added = fakeGames.size === 0 ? games : [];
                        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: added, games: games });
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", playOnDesktop);

                        if (progress >= secondsNeeded) {
                            completingQuest.set(quest.id, false);
                            updateProgress(quest.id, { secondsDone: secondsNeeded, status: "completed" });
                        } else {
                            updateProgress(quest.id, { status: "idle" });
                        }
                    }
                };
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", playOnDesktop);
            }).catch(() => {});
            break;
        }

        case "STREAM_ON_DESKTOP": {
            const fakeApp = {
                id: applicationId,
                name: `FakeApp ${applicationName} (CompleteDiscordQuest)`,
                pid: pid,
                sourceName: null,
            };
            fakeApplications.set(quest.id, fakeApp);
            
            if (!(ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata) {
                (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            }
            
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => {
                return fakeApplications.size > 0 ? Array.from(fakeApplications.values())[0] : (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata.call(ApplicationStreamingStore);
            };

            const streamOnDesktop = (event: any) => {
                if (event.questId !== quest.id) return;
                
                const progress = quest.config.configVersion === 1 ? event.userStatus.streamProgressSeconds : Math.floor(event.userStatus.progress.STREAM_ON_DESKTOP.value);
                updateProgress(quest.id, { secondsDone: progress });
                questStartTimes.set(quest.id, { startedAt: Date.now(), lastProgress: progress });

                if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                    fakeApplications.delete(quest.id);
                    
                    if (fakeApplications.size === 0 && (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata) {
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
                        delete (ApplicationStreamingStore as any)._originalGetStreamerActiveStreamMetadata;
                    }
                    
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", streamOnDesktop);

                    if (progress >= secondsNeeded) {
                        completingQuest.set(quest.id, false);
                        updateProgress(quest.id, { secondsDone: secondsNeeded, status: "completed" });
                    } else {
                        updateProgress(quest.id, { status: "idle" });
                    }
                }
            };
            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", streamOnDesktop);
            break;
        }

        case "PLAY_ACTIVITY": {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find((x: any) => x != null && x.VOCAL?.length > 0)?.VOCAL?.[0]?.channel?.id;
            const streamKey = `call:${channelId}:1`;

            const playActivity = async () => {
                while (true) {
                    try {
                        const res = await RestAPI.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
                        const progress = res.body.progress.PLAY_ACTIVITY.value;
                        updateProgress(quest.id, { secondsDone: progress });
                        
                        await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                        
                        if (!completingQuest.get(quest.id) || progress >= secondsNeeded) {
                            if (progress >= secondsNeeded) {
                                await RestAPI.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                                completingQuest.set(quest.id, false);
                                updateProgress(quest.id, { secondsDone: secondsNeeded, status: "completed" });
                            } else {
                                updateProgress(quest.id, { status: "idle" });
                            }
                            break;
                        }
                    } catch {
                        break;
                    }
                }
            };
            playActivity();
            break;
        }

        default:
            completingQuest.set(quest.id, false);
            updateProgress(quest.id, { status: "error" });
            break;
    }
}
