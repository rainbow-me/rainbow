/**
 * All events, used by `analytics.track()`
 */
export const event = {
  firstAppOpen: 'First App Open',
  applicationDidMount: 'React component tree finished initial mounting',
  pressedButton: 'Pressed Button',
  appStateChange: 'State change',
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
  swapSubmitted: 'Submitted Swap',
} as const;

/**
 * Properties corresponding to each event
 */
export type EventProperties = {
  [event.firstAppOpen]: undefined;
  [event.applicationDidMount]: undefined;
  [event.appStateChange]: {
    category: 'app state';
    label: string;
  };
  [event.pressedButton]: {
    buttonName: string;
    action: string;
  };
  [event.analyticsTrackingDisabled]: undefined;
  [event.analyticsTrackingEnabled]: undefined;
  [event.swapSubmitted]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
};
