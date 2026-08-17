import { findByCodeLazy } from "@webpack";

import { QuestProgress } from "../state";
import { QuestsStore } from "../stores";

const QuestIcon = findByCodeLazy("\"M7.5 21.7a8.95");

const TASK_LABELS: Record<string, string> = {
    WATCH_VIDEO: "Watch Video",
    WATCH_VIDEO_ON_MOBILE: "Watch Video",
    PLAY_ON_DESKTOP: "Play Game",
    STREAM_ON_DESKTOP: "Stream",
    PLAY_ACTIVITY: "Play Activity",
};

function formatTime(seconds: number): string {
    if (seconds <= 0) return "0m";
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remain = mins % 60;
    return remain > 0 ? `${hours}h ${remain}m` : `${hours}h`;
}

function resolveAssetUrl(questId: string, asset: string | undefined): string | undefined {
    if (!asset || asset === "PLACEHOLDER") return undefined;
    if (asset.startsWith("http")) return asset;
    if (asset.includes("/")) return `https://cdn.discordapp.com/${asset.replace(/^\/+/, "")}`;
    return `https://cdn.discordapp.com/quests/${questId}/${asset}${asset.includes(".") ? "" : ".png"}`;
}

function resolveIconUrl(questId: string, assets: any): string | undefined {
    const candidates = [
        assets.gameTileDark, assets.logotypeDark, assets.game_tile,
        assets.gameTile, assets.gameTileLight, assets.logotypeLight,
    ];

    const found = candidates.find(v => v && v !== "PLACEHOLDER");
    if (found) return resolveAssetUrl(questId, found);

    for (const [key, value] of Object.entries(assets)) {
        if (typeof value === "string" && (value.includes(".png") || value.includes(".jpg"))
            && !key.toLowerCase().includes("hero") && value !== "PLACEHOLDER") {
            return resolveAssetUrl(questId, value);
        }
    }

    return undefined;
}

interface QuestItemProps {
    questId: string;
    quest: QuestProgress;
    index: number;
}

export function QuestItem({ questId, quest, index }: QuestItemProps) {
    const pct = quest.secondsNeeded > 0
        ? Math.min(100, Math.max(0, (quest.secondsDone / quest.secondsNeeded) * 100))
        : 0;

    const fullQuest = Array.from(QuestsStore.quests.values()).find((q: QuestValue) => q.id === questId) as QuestValue | undefined;
    const assets = fullQuest?.config?.assets ?? {};
    const messages = fullQuest?.config?.messages ?? {};

    const displayName = messages.questName || quest.questName || quest.gameName || "Unknown Quest";
    const subtitle = messages.rewardName ? `Reward: ${messages.rewardName}` : messages.gameTitle || "";
    const description = messages.questDescription
        || (messages.gamePublisher ? `A quest from ${messages.gamePublisher}.` : "Complete this quest to earn rewards.");

    const iconUrl = resolveIconUrl(questId, assets);
    const bannerUrl = resolveAssetUrl(questId, assets.questBarHero || assets.hero);
    const statusClass = quest.status === "completed" ? "completed" : quest.status === "error" ? "error" : "running";
    const statusLabel = quest.status === "completed" ? "Completed" : quest.status === "error" ? "Error" : "Pending";

    return (
        <div className="vc-quest-item" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : "none", animationDelay: `${index * 0.1}s` }}>
            <div className="vc-quest-item-header">
                {iconUrl ? (
                    <img className="vc-quest-item-icon" src={iconUrl} alt="Icon" />
                ) : (
                    <div className="vc-quest-item-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background-tertiary, #1e1f22)" }}>
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
                    <span><span className="vc-quest-label">Type:</span> <span className="vc-quest-data">"{TASK_LABELS[quest.taskName] ?? quest.taskName}"</span></span>
                </div>
            </div>

            <div className="vc-quest-progress-track">
                <div className={`vc-quest-progress-fill ${statusClass}`} style={{ width: `${pct}%` }} />
            </div>

            <div className="vc-quest-item-footer">
                <span>{formatTime(quest.secondsDone)} / {formatTime(quest.secondsNeeded)} ({Math.round(pct)}%)</span>
                <span className={`vc-quest-status ${statusClass}`}>{statusLabel}</span>
            </div>
        </div>
    );
}
