import { findByProps } from "@webpack";
import { RestAPI } from "@webpack/common";

const questsApiModule = findByProps("enrollInQuest");

export const QuestApplyAction = (questId: string, action: QuestAction) => {
    if (questsApiModule?.enrollInQuest) {
        return questsApiModule.enrollInQuest(questId, action.questContent);
    }
    
    return RestAPI.post({ url: `/quests/${questId}/enroll`, body: { location: action.questContent ?? 0 } });
};

const locationMapModule = findByProps("QUEST_HOME_DESKTOP", "11");
export const QuestLocationMap = locationMapModule ?? { QUEST_HOME_DESKTOP: 0 };
