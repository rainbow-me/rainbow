import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';
import { FiatProviderName } from '@/entities/f2c';

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
  // notification promo sheet was shown
  notificationsPromoShown: 'notifications_promo.shown',
  // only for iOS — initial prompt is not allowed — Android is enabled by default
  notificationsPromoPermissionsBlocked:
    'notifications_promo.permissions_blocked',
  // only for iOS, Android is enabled by default
  notificationsPromoPermissionsGranted:
    'notifications_promo.permissions_granted',
  // if initially blocked, user must go to system settings and manually turn on notys
  notificationsPromoSystemSettingsOpened:
    'notifications_promo.system_settings_opened',
  // user enabled settings, and we sent them to our in-app settings
  notificationsPromoNotificationSettingsOpened:
    'notifications_promo.notification_settings_opened',
  // user either swiped the sheet away, or clicked "Not Now"
  notificationsPromoDismissed: 'notifications_promo.dismissed',
  cardPressed: 'card.pressed',
  learnArticleOpened: 'learn_article.opened',
  learnArticleShared: 'learn_article.shared',
  qrCodeViewed: 'qr_code.viewed',
  buyButtonPressed: 'buy_button.pressed',
  addWalletFlowStarted: 'add_wallet_flow.started',
  /**
   * Called either on click or during an open event callback. We want this as
   * early in the flow as possible.
   */
  f2cProviderFlowStarted: 'f2c.provider.flow_opened',
  /**
   * Called when the provider flow is completed and the user can close the
   * modal. This event DOES NOT mean we have transaction data.
   */
  f2cProviderFlowCompleted: 'f2c.provider.flow_completed',
  /**
   * Called if a provider flow throws an error.
   */
  f2cProviderFlowErrored: 'f2c.provider.flow_errored',
  /**
   * Called when we have transaction data. This is fired a while after a
   * provider flow completes because we need to wait for the transaction to hit
   * the blockchain.
   */
  f2cTransactionReceived: 'f2c.transaction_received',
  pairHwWalletNavEntered: 'pair_hw_wallet_nav.entered',
  pairHwWalletNavExited: 'pair_hw_wallet_nav.exited',
  rewardsViewedSheet: 'rewards.viewed_sheet',
  rewardsPressedPendingEarningsCard: 'rewards.pressed_pending_earnings_card',
  rewardsPressedAvailableCard: 'rewards.pressed_available_card',
  rewardsPressedPositionCard: 'rewards.pressed_position_card',
  rewardsPressedSwappedCard: 'rewards.pressed_swapped_card',
  rewardsPressedBridgedCard: 'rewards.pressed_bridged_card',
  rewardsPressedLeaderboardItem: 'rewards.pressed_leaderboard_item',

  wcNewPairing: 'New WalletConnect pairing',
  wcNewPairingTimeout: 'New WalletConnect pairing time out',
  wcNewSessionTimeout: 'New WalletConnect session time out',
  wcNewSessionRejected: 'Rejected new WalletConnect session',
  wcNewSessionApproved: 'Approved new WalletConnect session',
  wcShowingSigningRequest: 'Showing Walletconnect signing request',

  nftOffersOpenedOffersSheet: 'Opened NFT Offers Sheet',
  nftOffersOpenedSingleOfferSheet: 'Opened NFT Single Offer Sheet',
  nftOffersViewedExternalOffer: 'Viewed external NFT Offer',
  nftOffersSelectedSortCriterion: 'Selected NFT Offers Sort Criterion',
  nftOffersAcceptedOffer: 'Accepted NFT Offer',

  poapsOpenedMintSheet: 'Opened POAP mint sheet',
  poapsMintedPoap: 'Minted POAP',
  poapsViewedOnPoap: 'Viewed POAP on poap.gallery',
  positionsOpenedSheet: 'Opened position Sheet',
  positionsOpenedExternalDapp: 'Viewed external dapp',

  mintsPressedFeaturedMintCard: 'Pressed featured mint card',
  mintsPressedCollectionCell: 'Pressed collection cell in mints card',
  mintsPressedMintButton: 'Pressed mint button in mints sheet',
  mintsPressedViewAllMintsButton: 'Pressed view all mints button in mints card',
  mintsChangedFilter: 'Changed mints filter',
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
  [event.notificationsPromoShown]: undefined;
  [event.notificationsPromoPermissionsBlocked]: undefined;
  [event.notificationsPromoPermissionsGranted]: undefined;
  [event.notificationsPromoSystemSettingsOpened]: undefined;
  [event.notificationsPromoNotificationSettingsOpened]: undefined;
  [event.notificationsPromoDismissed]: undefined;
  [event.cardPressed]: {
    cardName: string;
    routeName: string;
    cardType: CardType;
  };
  [event.learnArticleOpened]: {
    durationSeconds: number;
    url: string;
    cardId: string;
    category: LearnCategory;
    displayType: CardType;
    routeName: string;
  };
  [event.learnArticleShared]: {
    url: string;
    category: string;
    cardId: string;
    durationSeconds: number;
  };
  [event.qrCodeViewed]: {
    component: string;
  };
  [event.buyButtonPressed]: {
    amount?: number;
    componentName: string;
    newWallet?: boolean;
    routeName: string;
  };
  [event.addWalletFlowStarted]: {
    isFirstWallet: boolean;
    type: 'backup' | 'seed' | 'watch' | 'ledger_nano_x' | 'new';
  };
  [event.f2cProviderFlowStarted]: {
    /**
     * Name of the provider that was selected
     */
    provider: FiatProviderName;
    /**
     * Locally-generated string ID used to associate start/complete events.
     */
    sessionId?: string;
  };
  [event.f2cProviderFlowCompleted]: {
    /**
     * Name of the provider that was selected. This should be saved along with
     * the pending transaction.
     */
    provider: FiatProviderName;
    /**
     * Locally-generated string ID used to associate start/complete events.
     * This should be saved along with the pending transaction so that when we
     * get transaction data we can emit an event with this sessionId.
     */
    sessionId?: string;
    /**
     * Whether or not we were able to determine if the onramp was successful. A
     * `true` value indicates YES, and `undefined` or `false` indicates NO, or
     * that this provider doesn't give us enough info to determine this.
     */
    success?: boolean;
    /**
     * The following properties are only available on some providers e.g. Ratio
     */
    fiat_amount?: string;
    fiat_currency?: string;
    fiat_source?: 'bank' | 'card';
    crypto_network?: string;
    crypto_amount?: string;
    crypto_price?: string;
    crypto_currency?: string;
    crypto_fee?: string;
  };
  [event.f2cProviderFlowErrored]: {
    /**
     * Name of the provider that was selected
     */
    provider: FiatProviderName;
    /**
     * Locally-generated string ID used to associate start/complete events.
     */
    sessionId?: string;
  };
  [event.f2cTransactionReceived]: {
    /**
     * Name of the provider that was selected
     */
    provider: FiatProviderName;
    /**
     * Locally-generated string ID used to associate start/complete events.
     * This should have been saved along with the pending transaction so that
     * when we get transaction data we can emit an event with this sessionId.
     */
    sessionId?: string;
  };
  [event.pairHwWalletNavEntered]: {
    entryPoint: string;
    isFirstWallet: boolean;
  };
  [event.pairHwWalletNavExited]: {
    entryPoint: string;
    isFirstWallet: boolean;
    step: string;
  };
  [event.rewardsViewedSheet]: undefined;
  [event.rewardsPressedPendingEarningsCard]: undefined;
  [event.rewardsPressedAvailableCard]: undefined;
  [event.rewardsPressedPositionCard]: { position: number };
  [event.rewardsPressedSwappedCard]: undefined;
  [event.rewardsPressedBridgedCard]: undefined;
  [event.rewardsPressedLeaderboardItem]: { ens?: string };

  [event.wcNewPairing]: {
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcNewPairingTimeout]: undefined;
  [event.wcNewSessionApproved]: {
    dappName: string;
    dappUrl: string;
  };
  [event.wcNewSessionTimeout]: undefined;
  [event.wcNewSessionRejected]: {
    dappName: string;
    dappUrl: string;
  };
  [event.wcShowingSigningRequest]: {
    dappName: string;
    dappUrl: string;
  };
  [event.nftOffersOpenedOffersSheet]: {
    entryPoint: string;
  };
  [event.nftOffersOpenedSingleOfferSheet]: {
    entryPoint: string;
    offerValueUSD: number;
    offerValue: number;
    offerCurrency: { symbol: string; contractAddress: string };
    floorDifferencePercentage: number;
    nft: {
      contractAddress: string;
      network: string;
      tokenId: string;
    };
  };
  [event.nftOffersViewedExternalOffer]: {
    marketplace: string;
    offerValueUSD: number;
    offerValue: number;
    offerCurrency: { symbol: string; contractAddress: string };
    floorDifferencePercentage: number;
    nft: {
      contractAddress: string;
      tokenId: string;
      network: string;
    };
  };
  [event.nftOffersSelectedSortCriterion]: {
    sortCriterion: string;
  };
  [event.nftOffersAcceptedOffer]: {
    status: 'in progress' | 'completed' | 'failed';
    nft: {
      contractAddress: string;
      tokenId: string;
      network: string;
    };
    marketplace: string;
    offerValue: number;
    offerValueUSD: number;
    floorDifferencePercentage: number;
    rainbowFee: number;
    offerCurrency: { symbol: string; contractAddress: string };
  };
  [event.poapsMintedPoap]: {
    eventId: number;
    type: 'qrHash' | 'secretWord';
  };
  [event.poapsOpenedMintSheet]: {
    eventId: number;
    type: 'qrHash' | 'secretWord';
  };
  [event.poapsViewedOnPoap]: {
    eventId: number;
  };
  [event.positionsOpenedExternalDapp]: {
    dapp: string;
    url: string;
  };
  [event.positionsOpenedSheet]: {
    dapp: string;
  };
  [event.mintsPressedFeaturedMintCard]: {
    contractAddress: string;
    chainId: number;
    totalMints: number;
    mintsLastHour: number;
    priceInEth: number;
  };
  [event.mintsPressedCollectionCell]: {
    contractAddress: string;
    chainId: number;
    priceInEth: number;
  };
  [event.mintsPressedMintButton]: {
    contractAddress: string;
    chainId: number;
    priceInEth: number;
  };
  [event.mintsPressedViewAllMintsButton]: undefined;
  [event.mintsChangedFilter]: { filter: string };
};
