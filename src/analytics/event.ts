import { CardType } from '@/components/cards/GenericCard';
import { LearnCardKey } from '@/components/cards/utils/types';

/**
 * All events, used by `analytics.track()`
 */
export const genericEvent = {
  firstAppOpen: 'First App Open',
  applicationDidMount: 'React component tree finished initial mounting',
  pressedButton: 'Pressed Button',
  appStateChange: 'State change',
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
  viewedQRCode: 'Viewed QR code',
  swapSubmitted: 'Submitted Swap',
} as const;

/**
 * Properties corresponding to each event
 */
export const swapEvent = {
  submittedSwap: 'Submitted Swap',
} as const;

/**
 * Events relevant to cards
 */
export const cardEvent = {
  learn: {
    openedCard: 'Opened Learn card',
    openedShare: 'Opened Learn article share modal',
  },
  generic: {
    opened: 'Opened card',
  },
} as const;

/**
 * A union of all event names. Use this when firing events via
 * `analytics.track`
 */
export const event = {
  generic: genericEvent,
  swap: swapEvent,
  card: cardEvent,
} as const;

/**
 * Properties corresponding to our uncategorized event object `genericEvent`
 */
type GenericEventProperties = {
  // old
  [event.generic.firstAppOpen]: undefined;
  [event.generic.applicationDidMount]: undefined;
  [event.generic.appStateChange]: {
    category: 'app state';
    label: string;
  };
  [event.generic.pressedButton]: {
    buttonName: string;
    action: string;
  };

  // new
  [event.generic.analyticsTrackingDisabled]: undefined;
  [event.generic.analyticsTrackingEnabled]: undefined;
  [event.generic.viewedQRCode]: {
    component: string;
  };
};

/**
 * Properties corresponding to our swaps event object `swapEvent`
 */
type SwapEventProperties = {
  [event.swap.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
};

/**
 * Properties corresponding to our swaps event object `cardEvent`
 */
type CardEventProperties = {
  [event.card.learn.openedCard]: {
    card: LearnCardKey;
    category: string;
    url: string;
    durationSeconds: number;
    displayType: CardType;
    fromScreen: string;
  };
  [event.card.learn.openedShare]: {
    card: LearnCardKey;
    category: string;
    url: string;
    durationSeconds: number;
  };
  [event.card.generic.opened]: {
    cardName: string;
    fromScreen: string;
    displayType: CardType;
  };
};

/**
 * A union of all event properties, used by `analytics.track`
 */
export type EventProperties = GenericEventProperties &
  SwapEventProperties &
  CardEventProperties;
