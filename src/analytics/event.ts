import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { GasSpeed } from '@/__swaps__/types/gas';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { UnlockableAppIconKey } from '@/appIcons/appIcons';
import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';
import { FiatProviderName } from '@/entities/f2c';
import { Network } from '@/networks/types';
import { RapSwapActionParameters } from '@/raps/references';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';

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
  promoSheetShown: 'promo_sheet.shown',
  promoSheetDismissed: 'promo_sheet.dismissed',
  swapSubmitted: 'Submitted Swap',
  // notification promo sheet was shown
  notificationsPromoShown: 'notifications_promo.shown',
  // only for iOS — initial prompt is not allowed — Android is enabled by default
  notificationsPromoPermissionsBlocked: 'notifications_promo.permissions_blocked',
  // only for iOS, Android is enabled by default
  notificationsPromoPermissionsGranted: 'notifications_promo.permissions_granted',
  // if initially blocked, user must go to system settings and manually turn on notys
  notificationsPromoSystemSettingsOpened: 'notifications_promo.system_settings_opened',
  // user enabled settings, and we sent them to our in-app settings
  notificationsPromoNotificationSettingsOpened: 'notifications_promo.notification_settings_opened',
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

  mintsOpenedSheet: 'Opened NFT Mint Sheet',
  mintsOpeningMintDotFun: 'Opening Mintdotfun',
  mintsMintingNFT: 'Minting NFT',
  mintsMintedNFT: 'Minted NFT',
  mintsErrorMintingNFT: 'Error Minting NFT',
  pointsViewedWeeklyEarnings: 'Viewed weekly earnings',
  pointsViewedClaimScreen: 'Viewed claim your points screen',
  pointsViewedReferralScreen: 'Viewed points referral code screen',
  pointsViewedPointsScreen: 'Viewed main points screen',
  pointsViewedOnboardingSheet: 'Viewed points onboarding screen',
  pointsReferralScreenValidatedReferralCode: 'Validated referral code',
  pointsOnboardingScreenPressedSignInButton: 'Pressed sign in button on points onboarding screen',
  pointsOnboardingScreenSuccessfullySignedIn: 'Successfully signed in on points onboarding screen',
  pointsOnboardingScreenFailedToSignIn: 'Failed to sign in on points onboarding screen',
  pointsOnboardingScreenPressedShareToXButton: 'Pressed share to X on points onboarding screen',
  pointsOnboardingScreenPressedSkipShareToXButton: 'Pressed skip button on onboarding screen',
  pointsOnboardingScreenPressedContinueButton: 'Pressed continue button on onboarding screen',
  pointsOnboardingScreenPressedDoneButton: 'Pressed done button on onboarding screen',
  pointsViewedWeeklyEarningsScreenPressedCloseButton: 'Pressed close button on weekly earnings screen',
  pointsReferralCodeDeeplinkOpened: 'Opened points referral code deeplink',
  pointsPointsScreenPressedCopyReferralCodeButton: 'Pressed copy referral code button on points screen',
  pointsPointsScreenPressedShareReferralLinkButton: 'Pressed share referral link button on points screen',

  remoteCardPrimaryButtonPressed: 'remote_card.primary_button_pressed',
  remoteCardDismissed: 'remote_card.dismissed',

  appIconUnlockSheetViewed: 'app_icon_unlock_sheet.viewed',
  appIconUnlockSheetCTAPressed: 'app_icon_unlock_sheet.cta_pressed',

  txRequestShownSheet: 'request.sheet.show',
  txRequestReject: 'request.rejected',
  txRequestApprove: 'request.approved',
  addNewWalletGroupName: 'add_new_wallet_group.name',

  // swaps related analytics
  swapsSelectedAsset: 'swaps.selected_asset',
  swapsSearchedForToken: 'swaps.searched_for_token',
  swapsChangedChainId: 'swaps.changed_chain_id',
  swapsFlippedAssets: 'swaps.flipped_assets',
  swapsToggledFlashbots: 'swaps.toggled_flashbots',
  swapsReceivedQuote: 'swaps.received_quote',
  swapsSubmitted: 'swaps.submitted',
  swapsFailed: 'swaps.failed',
  swapsSucceeded: 'swaps.succeeded',

  // app browser events
  browserTrendingDappClicked: 'browser.trending_dapp_pressed',
} as const;

type SwapEventParameters<T extends 'swap' | 'crosschainSwap'> = {
  createdAt: number;
  type: T;
  bridge: boolean;
  inputNativeValue: string | number;
  outputNativeValue: string | number;
  parameters: Omit<RapSwapActionParameters<T>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
  selectedGas: GasSettings;
  selectedGasSpeed: GasSpeed;
  slippage: string;
};

type SwapsEventFailedParameters<T extends 'swap' | 'crosschainSwap'> = {
  errorMessage: string | null;
} & SwapEventParameters<T>;

type SwapsEventSucceededParameters<T extends 'swap' | 'crosschainSwap'> = {
  nonce: number | undefined;
} & SwapEventParameters<T>;

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
  [event.pointsViewedWeeklyEarnings]: undefined;
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
    errorType: string | undefined;
  };
  [event.pointsOnboardingScreenPressedShareToXButton]: undefined;
  [event.pointsOnboardingScreenPressedSkipShareToXButton]: undefined;
  [event.pointsOnboardingScreenPressedContinueButton]: undefined;
  [event.pointsOnboardingScreenPressedDoneButton]: undefined;
  [event.pointsViewedWeeklyEarningsScreenPressedCloseButton]: undefined;
  [event.pointsReferralCodeDeeplinkOpened]: undefined;
  [event.pointsPointsScreenPressedCopyReferralCodeButton]: undefined;
  [event.pointsPointsScreenPressedShareReferralLinkButton]: undefined;

  [event.remoteCardPrimaryButtonPressed]: {
    cardKey: string;
    action: string;
    props: string;
  };
  [event.remoteCardDismissed]: {
    cardKey: string;
  };

  [event.appIconUnlockSheetViewed]: {
    appIcon: UnlockableAppIconKey;
  };
  [event.appIconUnlockSheetCTAPressed]: {
    appIcon: UnlockableAppIconKey;
  };
  [event.txRequestShownSheet]: {
    requestType: 'transaction' | 'signature';
    source: RequestSource;
  };
  [event.txRequestApprove]: {
    requestType: 'transaction' | 'signature';
    source: RequestSource;
    dappName: string;
    dappUrl: string;
    isHardwareWallet: boolean;
    network: Network;
  };
  [event.txRequestReject]: {
    source: RequestSource;
    requestType: 'transaction' | 'signature';
    isHardwareWallet: boolean;
  };
  [event.addNewWalletGroupName]: {
    name: string;
  };

  // swaps related events
  [event.swapsSelectedAsset]: {
    asset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    otherAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    type: SwapAssetType;
  };

  [event.swapsSearchedForToken]: {
    query: string;
    type: 'input' | 'output';
  };

  [event.swapsChangedChainId]: {
    inputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    type: 'input' | 'output';
    chainId: ChainId;
  };

  [event.swapsFlippedAssets]: {
    inputAmount: string | number;
    previousInputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    previousOutputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
  };

  [event.swapsToggledFlashbots]: {
    enabled: boolean;
  };

  [event.swapsReceivedQuote]: {
    inputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    outputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    quote: Quote | CrosschainQuote | QuoteError | null;
  };

  [event.swapsSubmitted]: SwapEventParameters<'swap' | 'crosschainSwap'>;
  [event.swapsFailed]: SwapsEventFailedParameters<'swap' | 'crosschainSwap'>;
  [event.swapsSucceeded]: SwapsEventSucceededParameters<'swap' | 'crosschainSwap'>;

  [event.browserTrendingDappClicked]: {
    name: string;
    url: string;
    hasClickedBefore: boolean;
    index: number;
  };
};
