import { useEffect, useState } from "@webpack/common";

import { questProgress, subscribeProgress } from "../state";
import { QuestsStore } from "../stores";

export interface QuestStatusCounts {
    enrollable: number;
    enrolled: number;
    claimable: number;
    claimed: number;
    expired: number;
}

export function computeQuestsStatus(): QuestStatusCounts {
    const quests = [...QuestsStore.quests.values()];
    return quests.reduce<QuestStatusCounts>((acc, x) => {
        if (new Date(x.config.expiresAt).getTime() < Date.now()) acc.expired++;
        else if (x.userStatus?.claimedAt) acc.claimed++;
        else if (x.userStatus?.completedAt) acc.claimable++;
        else if (x.userStatus?.enrolledAt) acc.enrolled++;
        else acc.enrollable++;
        return acc;
    }, { enrollable: 0, enrolled: 0, claimable: 0, claimed: 0, expired: 0 });
}

export function useQuestsStatus(): QuestStatusCounts {
    const [status, setStatus] = useState(computeQuestsStatus);

    useEffect(() => {
        const refresh = () => setStatus(computeQuestsStatus());
        QuestsStore.addChangeListener(refresh);
        return () => QuestsStore.removeChangeListener(refresh);
    }, []);

    return status;
}

export function useQuestProgress() {
    const [, forceUpdate] = useState(0);

    useEffect(() =>
        subscribeProgress(() => forceUpdate(n => n + 1))
    , []);

    return Array.from(questProgress.entries());
}
