// list of tracking events
export enum GenericEvents {
  pressedButton = 'Pressed Button',
  pressedButton2 = 'Pressed Button 2',
}

export enum SwapEvents {
  submittedSwap = 'Submitted Swap',
}

export const TrackingEvents = {
  swaps: SwapEvents,
  generics: GenericEvents,
} as const;

// list of tracking event properties
export interface TrackingEventProperties {
  [TrackingEvents.generics.pressedButton]: {
    buttonName: string;
    action: string;
  };
  [TrackingEvents.swaps.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
}
