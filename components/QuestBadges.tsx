import { Flex } from "@components/Flex";
import { findComponentByCodeLazy } from "@webpack";
import { Tooltip } from "@webpack/common";

import { useQuestsStatus } from "./hooks";

const CountBadge = findComponentByCodeLazy("renderBadgeCount", "disableColor");

const BADGE_CONFIG = [
    { key: "enrollable", label: "Enrollable", color: "var(--status-danger)" },
    { key: "enrolled", label: "Enrolled", color: "var(--status-warning)" },
    { key: "claimable", label: "Claimable", color: "var(--status-positive)" },
    { key: "claimed", label: "Claimed", color: "var(--blurple-50)" },
] as const;

export function QuestsCount() {
    const status = useQuestsStatus();

    return (
        <Flex flexDirection="row" justifyContent="flex-end" className="quest-button-badges" gap="5px">
            {BADGE_CONFIG.map(({ key, label, color }) =>
                status[key] > 0 && (
                    <Tooltip key={key} text={label}>
                        {({ onMouseEnter, onMouseLeave }) => (
                            <CountBadge
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                                count={status[key]}
                                color={color}
                                style={{ color: "var(--background-base-lowest)" }}
                            />
                        )}
                    </Tooltip>
                )
            )}
        </Flex>
    );
}
