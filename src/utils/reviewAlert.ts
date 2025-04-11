import * as ls from '@/storage';
import { ReviewPromptAction } from '@/storage/schema';
import { logger, RainbowError } from '@/logger';
import * as StoreReview from 'expo-store-review';
import { IS_TEST } from '@/env';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';

const ONE_WEEK = 60 * 60 * 24 * 7 * 1000;
const ONE_YEAR = 60 * 60 * 24 * 365 * 1000;

export const numberOfTimesBeforePrompt: {
  [key in ReviewPromptAction]: number;
} = {
  UserPrompt: 0, // this should never increment
  TimesLaunchedSinceInstall: 2,
  SuccessfulFiatToCryptoPurchase: 1,
  DappConnections: 1,
  Swap: 1,
  BridgeToL2: 1,
  AddingContact: 1,
  EnsNameSearch: 1,
  EnsNameRegistration: 1,
  WatchWallet: 1,
  ImportWallet: 1,
  CreateWallet: 1,
  NftFloorPriceVisit: 3,
};

function createReviewActions() {
  return Object.values(ReviewPromptAction).map(action => ({
    id: action,
    numOfTimesDispatched: 0,
  }));
}

export async function handleReviewPromptAction(action: ReviewPromptAction) {
  if (IS_TEST) return;
  logger.debug(`[reviewAlert]: handleReviewPromptAction: ${action}`);

  const promptTimestamps = ls.review.get(['promptTimestamps']) || [];

  // If user explicitly asks to review, we don't need to check any other conditions
  if (action === ReviewPromptAction.UserPrompt) {
    promptForReview({ promptTimestamps, action });
    return;
  }

  const actions = ls.review.get(['actions']) || createReviewActions();
  const actionToDispatch = actions.find(a => a.id === action);
  if (!actionToDispatch) {
    logger.warn(`[reviewAlert]: actionToDispatch not found: ${action}`);
    return;
  }

  actionToDispatch.numOfTimesDispatched += 1;
  const hasReachedActionThreshold = actionToDispatch.numOfTimesDispatched >= numberOfTimesBeforePrompt[action];
  if (hasReachedActionThreshold) {
    // set the numOfTimesDispatched to MAX
    actionToDispatch.numOfTimesDispatched = numberOfTimesBeforePrompt[action];
  }

  const now = Date.now();

  // iOS limits the number of prompts to 3 in a year. Android has something similar but does not say exactly what the limit is.
  const promptsWithinLastYear = promptTimestamps.filter((timestamp: number) => now - timestamp < ONE_YEAR);
  const hasReachedPromptLimit = promptsWithinLastYear.length >= 3;

  // Wait at least 1 week between prompts.
  const timeOfLastPrompt = promptTimestamps[promptTimestamps.length - 1] || 0;
  const hasPassedTimeSinceLastPrompt = now - timeOfLastPrompt > ONE_WEEK;

  if (hasReachedActionThreshold && hasPassedTimeSinceLastPrompt && !hasReachedPromptLimit) {
    logger.debug(`[reviewAlert]: Prompting for review`);
    actionToDispatch.numOfTimesDispatched = 0;
    promptForReview({ promptTimestamps, action });
  }

  ls.review.set(['actions'], actions);
}

async function promptForReview({ promptTimestamps, action }: { promptTimestamps: number[]; action: ReviewPromptAction }) {
  try {
    await StoreReview.requestReview();
    ls.review.set(['promptTimestamps'], [...promptTimestamps, Date.now()]);
    analytics.track(event.appStoreReviewPrompted, {
      action,
      promptCount: promptTimestamps.length + 1,
    });
  } catch (e) {
    logger.error(new RainbowError('[reviewAlert]: Failed to request review'), {
      error: e,
    });
  }
}
