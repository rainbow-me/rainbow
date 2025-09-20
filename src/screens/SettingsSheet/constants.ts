import { buildRainbowLearnUrl, LearnUTMCampaign } from '@/utils/buildRainbowUrl';

export const CUSTOM_MARGIN_TOP_ANDROID = 8;

export const SettingsExternalURLs = {
  rainbowHomepage: 'https://rainbow.me',
  rainbowLearn: buildRainbowLearnUrl({
    url: 'https://learn.rainbow.me',
    query: { campaign: LearnUTMCampaign.Settings },
  }),
  review: 'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};
