import AsyncStorage from '@react-native-community/async-storage';
import { Alert, Linking, NativeModules } from 'react-native';
const { RainbowRequestReview } = NativeModules;

export const AppleReviewAddress =
  'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review';

export const REVIEW_DONE_KEY = 'AppStoreReviewDone';
const REVIEW_ASKED_KEY = 'AppStoreReviewAsked';
let reviewDisplayedInTheSession = false;
const TWO_MONTHS = 2 * 30 * 24 * 60 * 60 * 1000;

export default async function maybeReviewAlert() {
  const reviewAsked = await AsyncStorage.getItem(REVIEW_ASKED_KEY);
  if (Number(reviewAsked) > Date.now() - TWO_MONTHS) {
    return;
  }

  const reviewDone = await AsyncStorage.getItem(REVIEW_DONE_KEY);
  if (reviewDone) {
    return;
  }
  // update to prevent double showing alert in one session
  if (reviewDisplayedInTheSession) {
    return;
  }
  reviewDisplayedInTheSession = true;

  AsyncStorage.setItem(REVIEW_ASKED_KEY, Date.now().toString());

  Alert.alert(
    `Are you enjoying Rainbow? 🥰`,
    'Leave a review on the App Store!',
    [
      {
        onPress: () => {
          AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
          if (reviewDisplayedInTheSession) {
            return;
          }
          RainbowRequestReview?.requestReview(handled => {
            if (!handled) {
              Linking.openURL(AppleReviewAddress);
            }
          });
        },
        text: 'Yes',
      },
      {
        text: 'No',
      },
    ]
  );
}
