/**
 * Uncategorized events
 */
export const genericEvent = {
  pressedButton: 'Pressed Button',
  pressedButton2: 'Pressed Button 2',
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
export const events = {
  generics: genericEvent,
  swaps: swapEvent,
} as const;

/**
 * Properties corresponding to our uncategorized event enum `GenericEvent`
 */
type GenericEventProperties = {
  [events.generics.pressedButton]: {
    buttonName: string;
    action: string;
  };
};

/**
 * Properties corresponding to our swaps event enum `GenericEvent`
 */
type SwapEventProperties = {
  [events.swaps.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
};

/**
 * A union of all event properties, used by `analytics.track`
 */
export type EventProperties = GenericEventProperties & SwapEventProperties;
