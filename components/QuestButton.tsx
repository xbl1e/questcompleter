import "./QuestButton.css";
import { Flex } from "@components/Flex";
import { findByCodeLazy, findComponentByCodeLazy } from "@webpack";
import { Popout, React, Tooltip, useEffect, useState } from "@webpack/common";
import { questProgress, progressListeners } from "../state";
import { QuestsStore } from "../stores";

const QuestIcon = findByCodeLazy("\"M7.5 21.7a8.95");
const TopBarButton = findComponentByCodeLazy("badgePosition", "icon");
const PanelButton = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");
const CountBadge = findComponentByCodeLazy("renderBadgeCount", "disableColor");

function questsStatus() {
    const availableQuests = [...QuestsStore.quests.values()];
    return availableQuests.reduce((acc, x) => {
        if (new Date(x.config.expiresAt).getTime() < Date.now()) {
            acc.expired++;
        } else if (x.userStatus?.claimedAt) {
            acc.claimed++;
        } else if (x.userStatus?.completedAt) {
            acc.claimable++;
        } else if (x.userStatus?.enrolledAt) {
            acc.enrolled++;
        } else {
            acc.enrollable++;
        }
        return acc;
    }, { enrollable: 0, enrolled: 0, claimable: 0, claimed: 0, expired: 0 });
}

export function QuestsCount() {
    const [status, setStatus] = useState(questsStatus());

    useEffect(() => {
        const checkForNewQuests = () => setStatus(questsStatus());
        QuestsStore.addChangeListener(checkForNewQuests);
        return () => QuestsStore.removeChangeListener(checkForNewQuests);
    }, []);

    return (
        <Flex flexDirection={"row"} justifyContent={"flex-end"} className={"quest-button-badges"} gap={"5px"}>
            {status.enrollable > 0 && (
                <Tooltip text={"Enrollable"}>
                    {({ onMouseEnter, onMouseLeave }) => (
                        <CountBadge
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            count={status.enrollable}
                            color={"var(--status-danger)"}
                            style={{ color: "var(--background-base-lowest)" }}
                        />
                    )}
                </Tooltip>
            )}
            {status.enrolled > 0 && (
                <Tooltip text={"Enrolled"}>
                    {({ onMouseEnter, onMouseLeave }) => (
                        <CountBadge
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            count={status.enrolled}
                            color={"var(--status-warning)"}
                            style={{ color: "var(--background-base-lowest)" }}
                        />
                    )}
                </Tooltip>
            )}
            {status.claimable > 0 && (
                <Tooltip text={"Claimable"}>
                    {({ onMouseEnter, onMouseLeave }) => (
                        <CountBadge
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            count={status.claimable}
                            color={"var(--status-positive)"}
                            style={{ color: "var(--background-base-lowest)" }}
                        />
                    )}
                </Tooltip>
            )}
            {status.claimed > 0 && (
                <Tooltip text={"Claimed"}>
                    {({ onMouseEnter, onMouseLeave }) => (
                        <CountBadge
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            count={status.claimed}
                            color={"var(--blurple-50)"}
                            style={{ color: "var(--background-base-lowest)" }}
                        />
                    )}
                </Tooltip>
            )}
        </Flex>
    );
}

function useQuestProgressStore() {
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const listener = () => forceUpdate(n => n + 1);
        progressListeners.add(listener);
        return () => { progressListeners.delete(listener); };
    }, []);
    return Array.from(questProgress.entries());
}

function friendlyTaskName(taskName: string): string {
    switch (taskName) {
        case "WATCH_VIDEO":
        case "WATCH_VIDEO_ON_MOBILE":
            return "Watch Video";
        case "PLAY_ON_DESKTOP":
            return "Play Game";
        case "STREAM_ON_DESKTOP":
            return "Stream";
        case "PLAY_ACTIVITY":
            return "Play Activity";
        default:
            return taskName;
    }
}

function formatTime(seconds: number): string {
    if (seconds <= 0) return "0m";
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}



function QuestProgressList({ width, isClosing }: { width?: number, isClosing?: boolean }) {
    const progressEntries = useQuestProgressStore();

    return (
        <div className={`vc-quest-popout-container ${isClosing ? "closing" : ""}`} style={width ? { width: `${width}px` } : undefined}>

            {progressEntries.length === 0 ? (
                <div className="vc-quest-popout-empty">No quests are currently being farmed.</div>
            ) : (
                <div className={`vc-quest-popout-list ${progressEntries.length > 2 ? 'scrollable' : ''}`}>
                    {progressEntries.map(([questId, quest], index) => {
                        const pct = quest.secondsNeeded > 0 ? Math.min(100, Math.max(0, (quest.secondsDone / quest.secondsNeeded) * 100)) : 0;
                        const fullQuest = Array.from(QuestsStore.quests.values()).find((q: QuestValue) => q.id === questId) as QuestValue | undefined;

                        const assets = fullQuest?.config?.assets || {};
                        const questMessages = fullQuest?.config?.messages || {};

                        const displayName = questMessages.questName || quest.questName || quest.gameName || "Unknown Quest";
                        const subtitle = questMessages.rewardName ? `Reward: ${questMessages.rewardName}` : questMessages.gameTitle || "";

                        let gameTile = assets.game_tile || assets.gameTile || assets.logotypeDark || assets.logotypeLight || assets.gameTileDark || assets.gameTileLight;

                        if (!gameTile || gameTile === "PLACEHOLDER") {
                            for (const [key, value] of Object.entries(assets)) {
                                if (typeof value === 'string' && (value.includes('.png') || value.includes('.jpg')) && !key.toLowerCase().includes('hero') && value !== "PLACEHOLDER") {
                                    gameTile = value;
                                    break;
                                }
                            }
                        }

                        let iconUrl: string | undefined;
                        if (gameTile) {
                            if (gameTile.startsWith("http")) {
                                iconUrl = gameTile;
                            } else if (gameTile.includes("/")) {
                                iconUrl = `https://cdn.discordapp.com/${gameTile.replace(/^\/+/, '')}`;
                            } else {
                                iconUrl = `https://cdn.discordapp.com/quests/${questId}/${gameTile}${gameTile.includes('.') ? '' : '.png'}`;
                            }
                        }

                        const hero = assets.questBarHero || assets.hero;
                        let bannerUrl: string | undefined;
                        if (hero) {
                            if (hero.startsWith("http")) {
                                bannerUrl = hero;
                            } else if (hero.includes("/")) {
                                bannerUrl = `https://cdn.discordapp.com/${hero.replace(/^\/+/, '')}`;
                            } else {
                                bannerUrl = `https://cdn.discordapp.com/quests/${questId}/${hero}${hero.includes('.') ? '' : '.png'}`;
                            }
                        }

                        const description = questMessages.questDescription
                            || (questMessages.gamePublisher ? `A quest from ${questMessages.gamePublisher}.` : "Complete this quest to earn rewards.");
                        const statusClass = quest.status === "completed" ? "completed" : quest.status === "error" ? "error" : "running";

                        return (
                            <div key={questId} className="vc-quest-item" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none', animationDelay: `${index * 0.1}s` }}>
                                <div className="vc-quest-item-header">
                                    {iconUrl ? (
                                        <img className="vc-quest-item-icon" src={iconUrl} alt="Icon" />
                                    ) : (
                                        <div className="vc-quest-item-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-tertiary, #1e1f22)' }}>
                                            <QuestIcon width={24} height={24} color="var(--text-muted)" />
                                        </div>
                                    )}
                                    <div className="vc-quest-item-content">
                                        <div className="vc-quest-item-name">{displayName}</div>
                                        <div className="vc-quest-item-subtitle">{subtitle}</div>
                                    </div>
                                </div>

                                <div className="vc-quest-item-info-box">
                                    <div className="vc-quest-item-description">
                                        <span className="vc-quest-label">Description:</span> <span className="vc-quest-data">{description}</span>
                                    </div>

                                    <div className="vc-quest-item-details">
                                        <span><span className="vc-quest-label">ID:</span> <span className="vc-quest-data">{questId}</span></span>
                                        <span><span className="vc-quest-label">Type:</span> <span className="vc-quest-data">"{friendlyTaskName(quest.taskName)}"</span></span>
                                    </div>
                                </div>

                                <div className="vc-quest-progress-track">
                                    <div className={`vc-quest-progress-fill ${statusClass}`} style={{ width: `${pct}%` }} />
                                </div>

                                <div className="vc-quest-item-footer">
                                    <span>{formatTime(quest.secondsDone)} / {formatTime(quest.secondsNeeded)} ({Math.round(pct)}%)</span>
                                    <span className={`vc-quest-status ${statusClass}`}>
                                        {quest.status === "completed" ? "Completed" : quest.status === "error" ? "Error" : "Pending"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function QuestButton() {
    const [state, setState] = useState(questsStatus());
    const [showPopout, setShowPopout] = useState(false);
    const [renderPopout, setRenderPopout] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const buttonRef = React.useRef<HTMLElement | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const checkForNewQuests = () => setState(questsStatus());
        QuestsStore.addChangeListener(checkForNewQuests);
        return () => QuestsStore.removeChangeListener(checkForNewQuests);
    }, []);

    useEffect(() => {
        if (showPopout) {
            setRenderPopout(true);
            setIsClosing(false);
        } else if (renderPopout) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setRenderPopout(false);
                setIsClosing(false);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [showPopout]);

    const handleToggle = () => {
        if (!showPopout) {
            const panels = document.querySelector('section[class*="panels_"]');
            if (panels) {
                setAnchorRect(panels.getBoundingClientRect());
            }
        }
        setShowPopout(s => !s);
    };

    const className = state.enrollable ? "quest-button-enrollable" : state.enrolled ? "quest-button-enrolled" : state.claimable ? "quest-button-claimable" : "";
    const tooltip = state.enrollable ? `${state.enrollable} Enrollable Quests` : state.enrolled ? `${state.enrolled} Enrolled Quests` : state.claimable ? `${state.claimable} Claimable Quests` : "Quests";

    const buttonProps = {
        className: className,
        showBadge: state.enrollable > 0 || state.enrolled > 0 || state.claimable > 0,
        badgePosition: "bottom",
        icon: QuestIcon,
        iconSize: 20,
        onClick: handleToggle,
        tooltip: showPopout ? null : tooltip,
        tooltipPosition: "bottom",
        hideOnClick: false
    };

    return (
        <Popout
            position="top"
            align="left"
            animation={Popout.Animation.NONE}
            shouldShow={renderPopout}
            onRequestClose={() => setShowPopout(false)}
            targetElementRef={buttonRef}
            renderPopout={() => {
                const leftOffset = anchorRect ? anchorRect.left : 0;
                const width = anchorRect ? anchorRect.width : 240;
                return (
                    <div style={{ position: 'fixed', left: leftOffset, width: width, bottom: anchorRect ? (window.innerHeight - anchorRect.top + 8) : undefined }}>
                        <QuestProgressList width={width} isClosing={isClosing} />
                    </div>
                );
            }}
        >
            {(_, { isShown }) => (
                <PanelButton
                    ref={buttonRef}
                    tooltipText={showPopout ? null : tooltip}
                    onClick={handleToggle}
                    icon={() => <div style={{ transform: 'scale(0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QuestIcon color="currentColor" /></div>}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}
