import { useQuestProgress } from "./hooks";
import { QuestItem } from "./QuestItem";

interface QuestProgressListProps {
    width?: number;
    isClosing?: boolean;
}

export function QuestProgressList({ width, isClosing }: QuestProgressListProps) {
    const entries = useQuestProgress();

    return (
        <div className={`vc-quest-popout-container ${isClosing ? "closing" : ""}`} style={width ? { width: `${width}px` } : undefined}>
            {entries.length === 0 ? (
                <div className="vc-quest-popout-empty">No quests are currently being farmed.</div>
            ) : (
                <div className={`vc-quest-popout-list ${entries.length > 2 ? "scrollable" : ""}`}>
                    {entries.map(([questId, quest], index) => (
                        <QuestItem key={questId} questId={questId} quest={quest} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}
