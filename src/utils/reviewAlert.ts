import AsyncStorage from '@react-native-async-storage/async-storage';
import lang from 'i18n-js';
import { Linking, NativeModules } from 'react-native';
import { WrappedAlert as Alert } from '@/helpers/alert';
const { RainbowRequestReview } = NativeModules;

export const AppleReviewAddress =
  'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review';

export const REVIEW_DONE_KEY = 'AppStoreReviewDone';
export const REVIEW_ASKED_KEY = 'AppStoreReviewAsked';
let reviewDisplayedInTheSession = false;
const TWO_MONTHS = 2 * 30 * 24 * 60 * 60 * 1000;

export const shouldPromptForReview = async (shouldPrompt = false) => {
  // when a user manually prompts for review on their own
  if (shouldPrompt) return true;

  const reviewAsked = await AsyncStorage.getItem(REVIEW_ASKED_KEY);
  if (Number(reviewAsked) > Date.now() - TWO_MONTHS) {
    return false;
  }

  const reviewDone = await AsyncStorage.getItem(REVIEW_DONE_KEY);
  if (reviewDone) {
    return false;
  }

  return true;
};

export default async function maybeReviewAlert() {
  const shouldPrompt = await shouldPromptForReview();
  if (!shouldPrompt) {
    return;
  }

  // update to prevent double showing alert in one session
  if (reviewDisplayedInTheSession) {
    return;
  }
  reviewDisplayedInTheSession = true;

  AsyncStorage.setItem(REVIEW_ASKED_KEY, Date.now().toString());

  Alert.alert(
    lang.t('review.alert.are_you_enjoying_rainbow'),
    lang.t('review.alert.leave_a_review'),
    [
      {
        onPress: () => {
          AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
          if (reviewDisplayedInTheSession) {
            return;
          }
          RainbowRequestReview?.requestReview((handled: any) => {
            if (!handled) {
              Linking.openURL(AppleReviewAddress);
            }
          });
        },
        text: lang.t('review.alert.yes'),
      },
      {
        text: lang.t('review.alert.no'),
      },
    ]
  );
}
