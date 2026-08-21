import { findByCodeLazy } from "@webpack";

import { QuestProgress } from "../state";
import { QuestsStore } from "../stores";

const QuestIcon = findByCodeLazy("\"M7.5 21.7a8.95");

const ORB_ICON_URL = "https://discord.com/assets/39556a7eb79145be.svg";
const COLLECTIBLES_CDN = "https://cdn.discordapp.com/media/v1/collectibles-shop";

const STATUS_CLASS_MAP: Record<string, string> = {
    completed: "completed",
    error: "error",
};

const STATUS_LABEL_MAP: Record<string, string> = {
    completed: "Completed",
    error: "Error",
};

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
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function resolveAssetUrl(questId: string, asset: string | undefined): string | undefined {
    if (!asset || asset === "PLACEHOLDER") return undefined;
    
    let url = "";
    if (asset.startsWith("http")) {
        url = asset;
    } else if (asset.includes("/")) {
        url = `https://cdn.discordapp.com/${asset.replace(/^\/+/, "")}`;
    } else {
        url = `https://cdn.discordapp.com/quests/${questId}/${asset}${asset.includes(".") ? "" : ".png"}`;
    }

    if (url.endsWith(".mp4")) {
        return `${url}?format=webp`;
    }
    return url;
}

function resolveIconUrl(questId: string, assets: Assets): string | undefined {
    const candidates = [
        assets.gameTileDark, assets.logotypeDark, assets.game_tile,
        assets.gameTile, assets.gameTileLight, assets.logotypeLight,
    ];

    const matchedAsset = candidates.find(v => v && v !== "PLACEHOLDER");
    if (matchedAsset) return resolveAssetUrl(questId, matchedAsset);

    for (const [key, value] of Object.entries(assets)) {
        if (typeof value === "string" && (value.includes(".png") || value.includes(".jpg") || value.includes(".mp4"))
            && !key.toLowerCase().includes("hero") && value !== "PLACEHOLDER") {
            return resolveAssetUrl(questId, value);
        }
    }

    return undefined;
}

function resolveRewardIcon(questId: string, reward: Reward | undefined, assets: Assets): string | undefined {
    if (reward?.orbQuantity) return ORB_ICON_URL;
    if (assets.rewardTile) return resolveAssetUrl(questId, assets.rewardTile);
    if (reward?.skuId) return `${COLLECTIBLES_CDN}/${reward.skuId}/animated`;
    return undefined;
}

interface QuestItemProps {
    questId: string;
    quest: QuestProgress;
    index: number;
}

export function QuestItem({ questId, quest, index }: QuestItemProps) {
    const percentage = quest.secondsNeeded > 0
        ? Math.min(100, Math.max(0, (quest.secondsDone / quest.secondsNeeded) * 100))
        : 0;

    const questData = Array.from(QuestsStore.quests.values()).find((q: QuestValue) => q.id === questId);
    const assets: Partial<Assets> = questData?.config?.assets ?? {};
    const messages: Partial<Messages> = questData?.config?.messages ?? {};

    const displayName = messages.questName || quest.questName || quest.gameName || "Unknown Quest";
    const subtitle = messages.rewardName ? `Reward: ${messages.rewardName}` : messages.gameTitle || "";
    const description = messages.questDescription
        || (messages.gamePublisher ? `A quest from ${messages.gamePublisher}.` : "Complete this quest to earn rewards.");

    const iconUrl = resolveIconUrl(questId, assets);
    const bannerUrl = resolveAssetUrl(questId, assets.questBarHero || assets.hero);
    const statusClass = STATUS_CLASS_MAP[quest.status] ?? "running";
    const statusLabel = STATUS_LABEL_MAP[quest.status] ?? "Pending";

    const reward = questData?.config?.rewardsConfig?.rewards?.[0];
    const rewardName = reward?.messages?.name ?? (reward?.orbQuantity ? `${reward.orbQuantity} Orbs` : null);
    const rewardIconUrl = resolveRewardIcon(questId, reward, assets);

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
                <div className={`vc-quest-progress-fill ${statusClass}`} style={{ width: `${percentage}%` }} />
            </div>

            <div className="vc-quest-item-footer">
                <span>{formatTime(quest.secondsDone)} / {formatTime(quest.secondsNeeded)} ({Math.round(percentage)}%)</span>
                {rewardName && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {rewardIconUrl && (
                            <img 
                                src={rewardIconUrl} 
                                alt="Reward" 
                                height={assets.rewardTile && !reward?.orbQuantity ? 20 : (reward?.orbQuantity ? 12 : 14)}
                                style={{ 
                                    borderRadius: assets.rewardTile && !reward?.orbQuantity ? "4px" : "0", 
                                    objectFit: "cover",
                                    aspectRatio: assets.rewardTile && !reward?.orbQuantity ? "auto" : "1/1",
                                    marginTop: reward?.orbQuantity ? "-1px" : "0"
                                }}
                            />
                        )}
                        {rewardName}
                    </span>
                )}
                <span className={`vc-quest-status ${statusClass}`}>{statusLabel}</span>
            </div>
        </div>
    );
}
