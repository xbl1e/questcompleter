import "./QuestButton.css";

import { findByCodeLazy, findComponentByCodeLazy } from "@webpack";
import { Popout, React, useEffect, useState } from "@webpack/common";

import { useQuestsStatus } from "./hooks";
import { QuestProgressList } from "./QuestPopout";

export { QuestsCount } from "./QuestBadges";

const QuestIcon = findByCodeLazy("\"M7.5 21.7a8.95");
const PanelButton = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");

export function QuestButton() {
    const status = useQuestsStatus();
    const [showPopout, setShowPopout] = useState(false);
    const [renderPopout, setRenderPopout] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const buttonRef = React.useRef<HTMLElement | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

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
            if (panels) setAnchorRect(panels.getBoundingClientRect());
        }
        setShowPopout(s => !s);
    };

    const tooltip = status.enrollable
        ? `${status.enrollable} Enrollable Quests`
        : status.enrolled
            ? `${status.enrolled} Enrolled Quests`
            : status.claimable
                ? `${status.claimable} Claimable Quests`
                : "Quests";

    return (
        <Popout
            position="top"
            align="left"
            animation={Popout.Animation.NONE}
            shouldShow={renderPopout}
            onRequestClose={() => setShowPopout(false)}
            targetElementRef={buttonRef}
            renderPopout={() => {
                const left = anchorRect?.left ?? 0;
                const width = anchorRect?.width ?? 240;
                return (
                    <div style={{ position: "fixed", left, width, bottom: anchorRect ? window.innerHeight - anchorRect.top + 8 : undefined }}>
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
                    icon={() => (
                        <div style={{ transform: "scale(0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <QuestIcon color="currentColor" />
                        </div>
                    )}
                    selected={isShown}
                />
            )}
        </Popout>
    );
}
