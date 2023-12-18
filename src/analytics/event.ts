import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';
import { FiatProviderName } from '@/entities/f2c';

/**
 * All events, used by `analytics.track()`
 */
export const event = {
  execJSBundle: 'js_bundle.exec',
  firstAppOpen: 'app.first_open',
  applicationDidMount: 'app.mounted',
  appStateChange: 'app_state.change',
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
  promoSheetShown: 'promo_sheet.shown',
  promoSheetDismissed: 'promo_sheet.dismissed',
  backupCompleted: 'backup.completed',
  backupChoosePasswordStep: 'backup.choose_password_step',
  backupConfirmPasswordStep: 'backup.confirm_password_step',
  swapSubmitted: 'swap.submitted',
  // notification promo sheet was shown
  notificationsPromoShown: 'notifications_promo.shown',
  // only for iOS — initial prompt is not allowed - Android is enabled by default
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

  wcNewPairing: 'wc.new_pairing',
  wcNewPairingTimeout: 'wc.new_pairing_timeout',
  wcNewSessionTimeout: 'wc.new_session_timeout',
  wcNewSessionRejected: 'wc.new_session_rejected',
  wcNewSessionApproved: 'wc.new_session_approved',
  wcShowingSigningRequest: 'wc.showing_signing_request',

  nftOffersOpenedOffersSheet: 'nft_offers.opened_offers_sheet',
  nftOffersOpenedSingleOfferSheet: 'nft_offers.opened_single_offer_sheet',
  nftOffersViewedExternalOffer: 'nft_offers.viewed_external_offer',
  nftOffersSelectedSortCriterion: 'nft_offers.selected_sort_criterion',
  nftOffersAcceptedOffer: 'nft_offers.accepted_offer',

  poapsOpenedMintSheet: 'poaps.opened_mint_sheet',
  poapsMintedPoap: 'poaps.minted_poap',
  poapsViewedOnPoap: 'poaps.viewed_on_poap',

  positionsOpenedSheet: 'positions.opened_sheet',
  positionsOpenedExternalDapp: 'positions.opened_external_dapp',

  mintsPressedFeaturedMintCard: 'mints.pressed_featured_mint_card',
  mintsPressedCollectionCell: 'mints.pressed_collection_cell',
  mintsPressedMintButton: 'mints.pressed_mint_button',
  mintsPressedViewAllMintsButton: 'mints.pressed_view_all_mints_button',
  mintsChangedFilter: 'mints.changed_filter',
  mintsOpenedSheet: 'mints.opened_sheet',
  mintsOpeningMintDotFun: 'mints.opening_mint_dot_fun',
  mintsMintingNFT: 'mints.minting_nft',
  mintsMintedNFT: 'mints.minted_nft',
  mintsErrorMintingNFT: 'mints.error_minting_nft',

  pointsViewedClaimScreen: 'points.viewed_claim_screen',
  pointsViewedReferralScreen: 'points.viewed_referral_screen',
  pointsViewedPointsScreen: 'points.viewed_points_screen',
  pointsViewedOnboardingSheet: 'points.viewed_onboarding_sheet',
  pointsReferralScreenValidatedReferralCode:
    'points.referral_screen.validated_referral_code',
  pointsOnboardingScreenPressedSignInButton:
    'points.onboarding_screen.pressed_sign_in_button',
  pointsOnboardingScreenSuccessfullySignedIn:
    'points.onboarding_screen.successfully_signed_in',
  pointsOnboardingScreenFailedToSignIn:
    'points.onboarding_screen.failed_to_sign_in',
  pointsOnboardingScreenPressedShareToXButton:
    'points.onboarding_screen.pressed_share_to_x_button',
  pointsOnboardingScreenPressedSkipShareToXButton:
    'points.onboarding_screen.pressed_skip_share_to_x_button',
  pointsOnboardingScreenPressedContinueButton:
    'points.onboarding_screen.pressed_continue_button',
  pointsOnboardingScreenPressedDoneButton:
    'points.onboarding_screen.pressed_done_button',
  pointsReferralCodeDeeplinkOpened: 'points.referral_code_deeplink_opened',
  pointsPointsScreenPressedCopyReferralCodeButton:
    'points.points_screen.pressed_copy_referral_code_button',
  pointsPointsScreenPressedShareReferralLinkButton:
    'points.points_screen.pressed_share_referral_link_button',

  pressedButton: 'button.pressed',

  qrCodeViewed: 'qr_code.viewed',
  qrCodeTapped: 'qr_code.tapped',
} as const;

/**
 * Properties corresponding to each event
 */
export type EventProperties = {
  [event.execJSBundle]: undefined;
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
  [event.backupCompleted]: {
    category: string;
    label: string;
  };
  [event.backupChoosePasswordStep]: {
    category: string;
    label: string;
  };
  [event.backupConfirmPasswordStep]: {
    category: string;
    label: string;
  };
  [event.swapSubmitted]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
  [event.promoSheetShown]: {
    campaign: string;
    time_viewed: number;
  };
  [event.promoSheetDismissed]: {
    campaign: string;
    time_viewed: number;
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
  [event.mintsMintingNFT]: {
    contract: string;
    chainId: number;
    quantity: number;
    collectionName: string;
    priceInEth: string;
  };
  [event.mintsMintedNFT]: {
    contract: string;
    chainId: number;
    quantity: number;
    collectionName: string;
    priceInEth: string;
  };
  [event.mintsErrorMintingNFT]: {
    contract: string;
    chainId: number;
    quantity: number;
    collectionName: string;
    priceInEth: string;
  };
  [event.mintsOpenedSheet]: {
    contract: string;
    chainId: number;
    collectionName: string;
  };
  [event.mintsOpeningMintDotFun]: {
    contract: string;
    chainId: number;
    collectionName: string;
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
  [event.pointsViewedClaimScreen]: undefined;
  [event.pointsViewedReferralScreen]: undefined;
  [event.pointsViewedPointsScreen]: undefined;
  [event.pointsViewedOnboardingSheet]: undefined;
  [event.pointsReferralScreenValidatedReferralCode]: {
    deeplinked: boolean;
  };
  [event.pointsOnboardingScreenPressedSignInButton]: {
    deeplinked: boolean;
    referralCode: boolean;
    hardwareWallet: boolean;
  };
  [event.pointsOnboardingScreenSuccessfullySignedIn]: {
    deeplinked: boolean;
    referralCode: boolean;
    hardwareWallet: boolean;
  };
  [event.pointsOnboardingScreenFailedToSignIn]: {
    deeplinked: boolean;
    referralCode: boolean;
    hardwareWallet: boolean;
  };
  [event.pointsOnboardingScreenPressedShareToXButton]: undefined;
  [event.pointsOnboardingScreenPressedSkipShareToXButton]: undefined;
  [event.pointsOnboardingScreenPressedContinueButton]: undefined;
  [event.pointsOnboardingScreenPressedDoneButton]: undefined;
  [event.pointsReferralCodeDeeplinkOpened]: undefined;
  [event.pointsPointsScreenPressedCopyReferralCodeButton]: undefined;
  [event.pointsPointsScreenPressedShareReferralLinkButton]: undefined;
  [event.qrCodeTapped]: {
    category: string;
  };
};
