/**
 * Uncategorized events
 */
export enum GenericEvent {
  pressedButton = 'Pressed Button',
  pressedButton2 = 'Pressed Button 2',
}

/**
 * Events relevant to or within the swaps product
 */
export enum SwapEvent {
  submittedSwap = 'Submitted Swap',
}

/**
 * A union of all event names. Use this when firing events via
 * `analytics.track`
 */
export const Events = {
  swaps: SwapEvent,
  generics: GenericEvent,
} as const;

/**
 * Properties corresponding to our uncategorized event enum `GenericEvent`
 */
type GenericEventProperties = {
  [Events.generics.pressedButton]: {
    buttonName: string;
    action: string;
  };
};

/**
 * Properties corresponding to our swaps event enum `GenericEvent`
 */
type SwapEventProperties = {
  [Events.swaps.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
};

/**
 * A union of all event properties, used by `analytics.track`
 */
export type EventProperties = GenericEventProperties & SwapEventProperties;
