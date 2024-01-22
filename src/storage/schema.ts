/**
 * Device data that's specific to the device and does not vary based on network or active wallet
 */
export type Device = {
  id: string;
  doNotTrack: boolean;

  /**
   * Undefined on first load of the app, meaning they're a new user. We set
   * this to `true` immediately, so that on subsequent loads we knew they've
   * already opened the app at least once.
   */
  isReturningUser: boolean;

  /**
   * Undefined when branch referring params have not been attempted to be set in
   * the past. We set this to `true` immediately after checking.
   */
  branchFirstReferringParamsSet: boolean;
};

/**
 * This schema is used for legacy data that was previously stored in
 * AsyncStorage. Since none of it is typed, we need to be overly permissive
 * here. WHEN we get around to typing that data, we can add more specific
 * properties here.
 */
export type Legacy = {
  // example of more specific typing
  // foo: boolean;
  [key: string]: any;
};

export type Account = {
  totalTokens: number;
};

export const enum ReviewPromptAction {
  UserPrompt = 'UserPrompt', // this is a special action that we use if the user manually prompts for review
  TimesLaunchedSinceInstall = 'TimesLaunchedSinceInstall',
  SuccessfulFiatToCryptoPurchase = 'SuccessfulFiatToCryptoPurchase',
  DappConnections = 'DappConnections',
  Swap = 'Swap',
  BridgeToL2 = 'BridgeToL2',
  AddingContact = 'AddingContact',
  EnsNameSearch = 'EnsNameSearch',
  EnsNameRegistration = 'EnsNameRegistration',
  WatchWallet = 'WatchWallet',
  NftFloorPriceVisit = 'NftFloorPriceVisit',
}

export type Action = {
  id: ReviewPromptAction;
  numOfTimesDispatched: number;
};

/**
 * Actions that the user can take that we want to track for review purposes
 * Each action has a specific number of times they must be performed before prompting for review
 *
 * NOTE: if a user has already reviewed, we don't want to prompt them again
 */
export type Review = {
  initialized: boolean;
  hasReviewed: boolean;
  timeOfLastPrompt: number;
  actions: Action[];
};

type CampaignKeys = {
  [campaignKey: string]: boolean;
};

type CampaignMetadata = {
  isCurrentlyShown: boolean;
  lastShownTimestamp: number;
};

export type Campaigns = CampaignKeys & CampaignMetadata;

export type Cards = {
  [cardKey: string]: boolean;
};
