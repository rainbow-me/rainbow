import lang from 'i18n-js';
import * as ls from '@/storage';
import { Linking, NativeModules } from 'react-native';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { ReviewPromptAction } from '@/storage/schema';
import { IS_IOS } from '@/env';
import { logger } from '@/logger';
import { IS_TESTING } from 'react-native-dotenv';

const { RainbowRequestReview, RNReview } = NativeModules;

export const AppleReviewAddress = 'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review';

const TWO_MONTHS = 1000 * 60 * 60 * 24 * 60;

export const numberOfTimesBeforePrompt: {
  [key in ReviewPromptAction]: number;
} = {
  UserPrompt: 0, // this should never increment
  TimesLaunchedSinceInstall: 5,
  SuccessfulFiatToCryptoPurchase: 1,
  DappConnections: 2,
  Swap: 2,
  BridgeToL2: 1,
  AddingContact: 1,
  EnsNameSearch: 1,
  EnsNameRegistration: 1,
  WatchWallet: 2,
  NftFloorPriceVisit: 3,
};

export const handleReviewPromptAction = async (action: ReviewPromptAction) => {
  logger.debug(`handleReviewPromptAction: ${action}`);

  if (IS_TESTING === 'true') {
    return;
  }

  if (action === ReviewPromptAction.UserPrompt) {
    promptForReview();
    return;
  }

  const hasReviewed = ls.review.get(['hasReviewed']);
  if (hasReviewed) {
    return;
  }

  const actions = ls.review.get(['actions']) || [];
  const actionToDispatch = actions.find(a => a.id === action);
  if (!actionToDispatch) {
    return;
  }

  const timeOfLastPrompt = ls.review.get(['timeOfLastPrompt']) || 0;
  logger.debug(`timeOfLastPrompt: ${timeOfLastPrompt}`);

  actionToDispatch.numOfTimesDispatched += 1;
  logger.debug(`numOfTimesDispatched: ${actionToDispatch.numOfTimesDispatched}`);

  const hasReachedAmount = actionToDispatch.numOfTimesDispatched >= numberOfTimesBeforePrompt[action];

  if (hasReachedAmount) {
    // set the numOfTimesDispatched to MAX
    actionToDispatch.numOfTimesDispatched = numberOfTimesBeforePrompt[action];
  }

  if (hasReachedAmount && timeOfLastPrompt + TWO_MONTHS <= Date.now()) {
    logger.debug(`Prompting for review`);
    actionToDispatch.numOfTimesDispatched = 0;
    ls.review.set(['timeOfLastPrompt'], Date.now());
    promptForReview();
  }

  ls.review.set(['actions'], actions);
};

export const promptForReview = async () => {
  Alert.alert(lang.t('review.alert.are_you_enjoying_rainbow'), lang.t('review.alert.leave_a_review'), [
    {
      onPress: () => {
        ls.review.set(['hasReviewed'], true);

        if (IS_IOS) {
          RainbowRequestReview?.requestReview((handled: boolean) => {
            if (!handled) {
              Linking.openURL(AppleReviewAddress);
            }
          });
        } else {
          RNReview.show();
        }
      },
      text: lang.t('review.alert.yes'),
    },
    {
      text: lang.t('review.alert.no'),
    },
  ]);
};
