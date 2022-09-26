// list of tracking events
export enum generics {
  pressedButton = 'Pressed Button',
  pressedButton2 = 'Pressed Button 2',
}

export enum swaps {
  submittedSwap = 'Submitted Swap',
}

// how im thinking of improving readability and introducing automated category tagging
export const TrackingEvents = { ...generics, ...swaps };

// list of tracking event properties
export interface TrackingEventProperties {
  [TrackingEvents.pressedButton]: {
    buttonName: string;
    action: string;
  };
  [TrackingEvents.submittedSwap]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
}
