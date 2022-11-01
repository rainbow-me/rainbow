/**
 * Uncategorized events
 */
export const genericEvent = {
  // old
  firstAppOpen: 'First App Open',
  applicationDidMount: 'React component tree finished initial mounting',
  pressedButton: 'Pressed Button',
  appStateChange: 'State change',

  // new
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
} as const;

/**
 * Events relevant to or within the swaps product
 */
export const swapEvent = {
  submittedSwap: 'Submitted Swap',
} as const;

/**
 * A union of all event names. Use this when firing events via
 * `analytics.track`
 */
export const event = {
  generic: genericEvent,
  swap: swapEvent,
} as const;

/**
 * Properties corresponding to our uncategorized event enum `GenericEvent`
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
};

/**
 * Properties corresponding to our swaps event enum `GenericEvent`
 */
type SwapEventProperties = {
  [event.swap.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
};

/**
 * A union of all event properties, used by `analytics.track`
 */
export type EventProperties = GenericEventProperties & SwapEventProperties;
