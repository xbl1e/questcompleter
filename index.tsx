import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

import { QuestButton, QuestsCount } from "./components/QuestButton";
import { resetClaimState, stopAllFarming, updateQuests } from "./core/manager";
import settings from "./settings";
import { fakeApplications, fakeGames } from "./state";
import { QuestsStore } from "./stores";

const COPYRIGHT_WARNING = [
    "All rights reserved to xbl1e.",
    "",
    "If you downloaded this extension from anywhere other than https://github.com/xbl1e/completeDiscordQuest, it may be MALWARE.",
    "",
    "If you paid for this extension, you have been SCAMMED. This plugin is 100% free.",
    "",
    "Press OK to acknowledge.",
].join("\n");

const CONSENT_WARNING = [
    "Important Notice",
    "",
    "As of April 7th 2026, Discord has expressed their intent to crack down on automating quest completion.",
    "",
    "Use this plugin at your own risk, as you may get flagged by doing so.",
    "",
    "Press OK to keep using this plugin, or Cancel to keep automation disabled.",
].join("\n");

function ensureConsent(): boolean {
    if (settings.store.hasAcceptedToUsePlugin) return true;

    if (!window.confirm(COPYRIGHT_WARNING)) return false;

    const accepted = window.confirm(CONSENT_WARNING);
    settings.store.hasAcceptedToUsePlugin = accepted;
    return accepted;
}

export default definePlugin({
    name: "QuestCompleter",
    description: "A plugin that automatically completes discord quests.",
    authors: [{ name: "xbl1e", id: 1530954739431374989n }],
    settings,
    patches: [
        {
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            replacement: {
                match: /children:\[(?=.{0,25}?accountContainerRef)/,
                replace: "children:[$self.renderQuestButtonSettingsBar(),",
            },
        },
        {
            find: "\"innerRef\",\"navigate\",\"onClick\"",
            replacement: {
                match: /(\i).createElement\("a",(\i)\)/,
                replace: "$1.createElement(\"a\",$self.renderQuestButtonBadges($2))",
            },
        },
        {
            find: "\"RunningGameStore\"",
            group: true,
            replacement: [
                {
                    match: /}getRunningGames\(\){return/,
                    replace: "}getRunningGames(){const games=$self.getRunningGames();return games ? games : ",
                },
                {
                    match: /}getGameForPID\((\i)\){/,
                    replace: "}getGameForPID($1){const pid=$self.getGameForPID($1);if(pid){return pid;}",
                },
            ],
        },
        {
            find: "ApplicationStreamingStore",
            replacement: {
                match: /}getStreamerActiveStreamMetadata\(\){/,
                replace: "}getStreamerActiveStreamMetadata(){const metadata=$self.getStreamerActiveStreamMetadata();if(metadata){return metadata;}",
            },
        },
    ],

    start() {
        if (!ensureConsent()) {
            stopAllFarming();
            return;
        }
        QuestsStore.addChangeListener(updateQuests);
        FluxDispatcher.subscribe("LOGOUT", this._handleLogout);
        FluxDispatcher.subscribe("CONNECTION_CLOSED", this._handleLogout);
        setTimeout(updateQuests, 8000);
    },

    stop() {
        QuestsStore.removeChangeListener(updateQuests);
        FluxDispatcher.unsubscribe("LOGOUT", this._handleLogout);
        FluxDispatcher.unsubscribe("CONNECTION_CLOSED", this._handleLogout);
        stopAllFarming();
    },

    _handleLogout() {
        stopAllFarming();
        resetClaimState();
    },

    renderQuestButtonTopBar: () => null,
    renderQuestButtonSettingsBar: () => <QuestButton type="settings-bar" />,

    renderQuestButtonBadges(questButton: any) {
        if (!settings.store.showQuestsButtonBadges) return questButton;

        if (typeof questButton === "string" && questButton === "quests") {
            return <QuestsCount />;
        }

        if (questButton?.href?.startsWith("/quest-home")
            && Array.isArray(questButton?.children)
            && questButton.children.findIndex((child: any) => child?.type === QuestsCount) === -1) {
            questButton.children.push(<QuestsCount />);
        }

        return questButton;
    },

    getRunningGames() {
        if (fakeGames.size > 0) return Array.from(fakeGames.values());
    },

    getGameForPID(pid: number) {
        if (fakeGames.size > 0) return Array.from(fakeGames.values()).find(g => g.pid === pid);
    },

    getStreamerActiveStreamMetadata() {
        if (fakeApplications.size > 0) return Array.from(fakeApplications.values()).at(0);
    },
});
