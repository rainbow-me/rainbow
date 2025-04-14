import { AddressOrEth, ExtendedAnimatedAssetWithColors, ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { UnlockableAppIconKey } from '@/appIcons/appIcons';
import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';
import { FiatProviderName } from '@/entities/f2c';
import { TrendingToken } from '@/resources/trendingTokens/trendingTokens';
import { TokenLauncherAnalyticsParams } from '@/screens/token-launcher/state/tokenLauncherStore';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { FavoritedSite } from '@/state/browser/favoriteDappsStore';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { ENSRapActionType } from '../raps/common';
import { AnyPerformanceLog, Screen } from '../state/performance/operations';

/**
 * All events, used by `analytics.track()`
 */
export const event = {
  excludedFromFeaturePromo: 'Excluded from Feature Promo',
  manuallyDisconnectedFromWalletConnectConnection: 'Manually disconnected from WalletConnect connection',
  receivedWcConnection: 'Received wc connection',
  resetAssetSelectionSend: 'Reset Asset Selection Send',
  searchQuery: 'Search Query',
  showSecretView: 'Show Secret View',
  shownWalletconnectSessionRequest: 'Shown Walletconnect session request',
  tappedAddExistingWallet: 'Tapped Add Existing Wallet',
  tappedCreateNewWallet: 'Tapped Create New Wallet',
  tappedDeleteWallet: 'Tapped Delete Wallet',
  tappedEdit: 'Tapped Edit',
  tappedWatchAddress: 'Tapped Watch Address',
  toggledAnNFTAsHidden: 'Toggled an NFT as Hidden',
  viewedEnsProfile: 'Viewed ENS profile',
  viewedFeaturePromo: 'Viewed Feature Promo',
  viewedProfile: 'Viewed profile',
  applicationBecameInteractive: 'Application became interactive',
  changedLanguage: 'Changed language',
  changedNativeCurrency: 'Changed native currency',
  changedNetwork: 'Changed network',
  changedNativeCurrencyInputSend: 'Changed native currency input in Send flow',
  changedTokenInputSend: 'Changed token input in Send flow',
  sentTransaction: 'Sent transaction',
  setAppIcon: 'Set App Icon',
  tappedDoneEditingWallet: 'Tapped "Done" after editing wallet',
  tappedCancelEditingWallet: 'Tapped "Cancel" after editing wallet',
  tappedEditWallet: 'Tapped "Edit Wallet"',
  tappedNotificationSettings: 'Tapped "Notification Settings"',
  tappedDeleteWalletConfirm: 'Tapped "Delete Wallet" (final confirm)',
  errorUpdatingBackupStatus: 'Error updating Backup status',
  errorDuringICloudBackup: `Error during iCloud Backup`,
  errorDuringGoogleDriveBackup: `Error during Google Drive Backup`,
  ignoreHowToEnableICloud: 'Ignore how to enable iCloud',
  viewHowToEnableICloud: 'View how to Enable iCloud',
  iCloudNotEnabled: 'iCloud not enabled',
  importedSeedPhrase: 'Imported seed phrase',
  showWalletProfileModalForImportedWallet: 'Show wallet profile modal for imported wallet',
  showWalletProfileModalForReadOnlyWallet: 'Show wallet profile modal for read only wallet',
  showWalletProfileModalForUnstoppableAddress: 'Show wallet profile modal for Unstoppable address',
  showWalletProfileModalForENSAddress: 'Show wallet profile modal for ENS address',
  tappedImportButton: 'Tapped "Import" button',
  startedExecutingJavaScriptBundle: 'Started executing JavaScript bundle',
  firstAppOpen: 'First App Open',
  applicationDidMount: 'React component tree finished initial mounting',
  pressedButton: 'Pressed Button',
  appStateChange: 'State change',
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
  promoSheetShown: 'promo_sheet.shown',
  promoSheetDismissed: 'promo_sheet.dismissed',
  swapSubmitted: 'Submitted Swap',
  cardPressed: 'card.pressed',
  learnArticleOpened: 'learn_article.opened',
  learnArticleShared: 'learn_article.shared',
  qrCodeViewed: 'qr_code.viewed',
  buyButtonPressed: 'buy_button.pressed',
  addWalletFlowStarted: 'add_wallet_flow.started',
  sendMaxPressed: 'Clicked "Max" in Send flow input',

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
  notificationsPromoNotificationSettingsChanged: 'Changed Global Notification Settings',
  notificationsPromoTapped: 'Tapped Push Notification',

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

  wcRequestFailed: 'wc.failed_request',

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
  swapsToggledDegenMode: 'swaps.toggled_degen_mode',
  swapsReceivedQuote: 'swaps.received_quote',
  swapsSubmitted: 'swaps.submitted',
  swapsFailed: 'swaps.failed',
  swapsSucceeded: 'swaps.succeeded',
  swapsQuoteFailed: 'swaps.quote_failed',
  swapsGasUpdatedPrice: 'Updated Gas Price',

  // app browser events
  browserTrendingDappClicked: 'browser.trending_dapp_pressed',
  browserAddFavorite: 'browser.add_favorite',
  browserTapFavorite: 'browser.tap_favorite',

  performanceTimeToSign: 'performance.time_to_sign',
  performanceTimeToSignOperation: 'performance.time_to_sign.operation',

  addFavoriteToken: 'add_favorite_token',
  watchWallet: 'watch_wallet',

  // claimables
  claimClaimableSucceeded: 'claim_claimable.succeeded',
  claimClaimableFailed: 'claim_claimable.failed',
  claimablePanelOpened: 'claimable_panel.opened',

  // error boundary
  errorBoundary: 'error_boundary.viewed',
  errorBoundaryReset: 'error_boundary.reset',

  // token details
  tokenDetailsErc20: 'token_details.erc20',
  tokenDetailsNFT: 'token_details.nft',

  // token lists (wallet, swap, send)
  tokenList: 'token_list',

  // trending tokens
  viewTrendingToken: 'trending_tokens.view_trending_token',
  viewRankedCategory: 'trending_tokens.view_ranked_category',
  changeNetworkFilter: 'trending_tokens.change_network_filter',
  changeTimeframeFilter: 'trending_tokens.change_timeframe_filter',
  changeSortFilter: 'trending_tokens.change_sort_filter',
  hasLinkedFarcaster: 'trending_tokens.has_linked_farcaster',

  // token launcher
  tokenLauncherStepChanged: 'token_launcher.step_changed',
  tokenLauncherTokenCreated: 'token_launcher.token_created',
  tokenLauncherSharePressed: 'token_launcher.share_pressed',
  tokenLauncherAbandoned: 'token_launcher.abandoned',
  tokenLauncherCreationFailed: 'token_launcher.creation_failed',
  tokenLauncherImageUploadFailed: 'token_launcher.image_upload_failed',
  tokenLauncherWalletLoadFailed: 'token_launcher.wallet_load_failed',

  // network status
  networkStatusOffline: 'network_status.offline',
  networkStatusReconnected: 'network_status.reconnected',


  // wallet initialization
  walletInitializationFailed: 'wallet_initialization.failed',
  
  // performance
  performanceReport: 'performance.report',
  performanceInitializeWallet: 'Performance Wallet Initialize Time',

  // discover screen
  timeSpentOnDiscoverScreen: 'Time spent on the Discover screen',

  // ens
  ensInitiatedRegistration: 'Initiated ENS registration',
  ensEditedRecords: 'Edited ENS records',
  ensCompletedRegistration: 'Completed ENS registration',
  ensExtended: 'Extended ENS',
  ensTransferredControl: 'Transferred ENS control',
  ensSetPrimary: 'Set ENS to primary ',
  ensRapFailed: 'Rap failed',
  ensRapStarted: 'Rap started',
  ensRapCompleted: 'Rap completed',

  // backup
  backupError: 'backup.error',
  backupSavedPassword: 'Saved backup password on iCloud',
  backupSkippedPassword: "Didn't save backup password on iCloud",
  backupComplete: 'Backup Complete',
  backupConfirmed: 'Tapped "Confirm Backup"',
  backupSheetShown: 'BackupSheet shown',
  backupChoosePassword: 'Choose Password Step',

  // QR code
  qrCodeScannedAddress: 'Scanned address QR code',
  qrCodeScannedProfile: 'Scanned Rainbow profile url',
  qrCodeScannedWalletConnect: 'Scanned WalletConnect QR code',
  qrCodeScannedInvalid: 'Scanned broken or unsupported QR code',

  // navigation events
  navigationAddCash: 'Tapped "Add Cash"',
  navigationSwap: 'Tapped "Swap"',
  navigationSend: 'Tapped "Send"',
  navigationMyQrCode: 'Tapped "My QR Code"',

  // Wallet Profile Modal Events
  walletProfileCancelled: 'Tapped "Cancel" on Wallet Profile modal',
  walletProfileSubmitted: 'Tapped "Submit" on Wallet Profile modal',

  // welcome screen
  welcomeNewWallet: 'Tapped "Get a new wallet"',
  welcomeAlreadyHave: 'Tapped "I already have one"',

  // discover screen
  discoverTapSearch: 'Tapped Search',
} as const;

export type QuickBuyAnalyticalData =
  | {
      assetUniqueId: UniqueId;
      buyWithAssetUniqueId: UniqueId;
      currencyAmount: number;
      assetAmount: number;
    }
  | undefined;

type SwapEventParameters<T extends 'swap' | 'crosschainSwap'> = {
  type: T;
  isBridge: boolean;
  inputAssetSymbol: string;
  inputAssetName: string;
  inputAssetAddress: AddressOrEth;
  inputAssetChainId: ChainId;
  inputAssetType: string;
  inputAssetAmount: number;
  outputAssetSymbol: string;
  outputAssetName: string;
  outputAssetAddress: AddressOrEth;
  outputAssetChainId: ChainId;
  outputAssetType: string;
  outputAssetAmount: number;
  mainnetAddress: string;
  tradeAmountUSD: number;
  degenMode: boolean;
  isSwappingToPopularAsset: boolean;
  isSwappingToTrendingAsset: boolean;
  isHardwareWallet: boolean;
  quickBuyData?: QuickBuyAnalyticalData;
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
  [event.sendMaxPressed]: undefined;
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
  [event.notificationsPromoNotificationSettingsChanged]: {
    topic: string;
    action: string;
  };
  [event.notificationsPromoTapped]: {
    campaign: string;
  };
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
  [event.wcRequestFailed]: {
    type: 'session_proposal' | 'session_request' | 'read only wallet' | 'method not supported' | 'invalid namespaces' | 'dapp browser';
    reason: string;
    method?: string;
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
  [event.swapsGasUpdatedPrice]: { gasPriceOption: string };
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
    chainId: ChainId | undefined;
  };

  [event.swapsFlippedAssets]: {
    inputAmount: string | number;
    previousInputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
    previousOutputAsset: ParsedSearchAsset | ExtendedAnimatedAssetWithColors | null;
  };

  [event.swapsToggledDegenMode]: {
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

  [event.swapsQuoteFailed]: {
    error_code: number | undefined;
    reason: string;
    inputAsset: { symbol: string; address: string; chainId: ChainId };
    inputAmount: string | number;
    outputAsset: { symbol: string; address: string; chainId: ChainId };
    outputAmount: string | number | undefined;
  };

  [event.browserTrendingDappClicked]: {
    name: string;
    url: string;
    hasClickedBefore: boolean;
    index: number;
  };
  [event.browserAddFavorite]: FavoritedSite;
  [event.browserTapFavorite]: FavoritedSite;

  [event.performanceTimeToSign]: {
    screen: Screen;
    completedAt: number;
    elapsedTime: number;
  };

  [event.performanceTimeToSignOperation]: AnyPerformanceLog;

  [event.addFavoriteToken]: {
    address: AddressOrEth;
    chainId: ChainId;
    name: string;
    symbol: string;
  };

  [event.watchWallet]: {
    addressOrEnsName: string;
    address: string;
  };

  [event.claimClaimableSucceeded]: {
    claimableId: string;
    claimableType: 'transaction' | 'sponsored' | 'rainbowCoin';
    chainId: ChainId;
    asset: {
      symbol: string;
      address: string;
    };
    outputAsset: {
      symbol: string;
      address: string;
    };
    outputChainId: ChainId;
    isSwapping: boolean;
    amount: string;
    usdValue: number;
  };

  [event.claimClaimableFailed]: {
    claimableId: string;
    claimableType: 'transaction' | 'sponsored' | 'rainbowCoin';
    chainId: ChainId;
    asset: {
      symbol: string;
      address: string;
    };
    isSwapping: boolean;
    outputAsset: {
      symbol: string;
      address: string;
    };
    outputChainId: ChainId;
    failureStep: 'claim' | 'swap' | 'unknown';
    amount: string;
    usdValue: number;
    errorMessage: string;
  };

  [event.claimablePanelOpened]: {
    claimableId: string;
    claimableType: 'transaction' | 'sponsored' | 'rainbowCoin';
    chainId: ChainId;
    asset: {
      symbol: string;
      address: string;
    };
    amount: string;
    usdValue: number;
  };

  [event.errorBoundary]: { error: Error | null };
  [event.errorBoundaryReset]: { error: Error | null };

  [event.tokenDetailsErc20]: {
    token: {
      address: string;
      chainId: ChainId;
      symbol: string;
      name: string;
      icon_url: string | undefined;
      price: number | undefined;
    };
    eventSentAfterMs: number;
    available_data: {
      chart: boolean;
      description: boolean;
      iconUrl: boolean;
    };
  };
  [event.tokenDetailsNFT]: {
    token: {
      isPoap: boolean;
      isParty: boolean;
      isENS: boolean;
      address: string;
      chainId: ChainId;
      name: string;
      image_url: string | null | undefined;
    };
    eventSentAfterMs: number;
    available_data: { description: boolean; image_url: boolean; floorPrice: boolean };
  };

  [event.tokenList]: {
    screen: 'wallet' | 'swap' | 'send' | 'discover';
    total_tokens: number;
    no_icon: number;
    no_price?: number;
    query?: string; // query is only sent for the swap screen
  };

  [event.viewTrendingToken]: {
    address: TrendingToken['address'];
    chainId: TrendingToken['chainId'];
    symbol: TrendingToken['symbol'];
    name: TrendingToken['name'];
    highlightedFriends: number;
  };

  [event.viewRankedCategory]: {
    category: string;
    chainId: ChainId | undefined;
    isLimited: boolean;
    isEmpty: boolean;
  };

  [event.changeNetworkFilter]: {
    chainId: ChainId | undefined;
  };

  [event.changeTimeframeFilter]: {
    timeframe: string;
  };

  [event.changeSortFilter]: {
    sort: string | undefined;
  };

  [event.hasLinkedFarcaster]: {
    hasFarcaster: boolean;
    personalizedTrending: boolean;
    walletHash: string;
  };

  // token launcher
  [event.tokenLauncherStepChanged]: {
    step: string;
  };
  [event.tokenLauncherWalletLoadFailed]: {
    error: string;
  };
  [event.tokenLauncherImageUploadFailed]: {
    error: string;
    url?: string;
    isModerated?: boolean;
  };
  [event.tokenLauncherCreationFailed]: TokenLauncherAnalyticsParams & {
    error: string;
    operation?: string;
    source?: string;
    transactionHash?: string;
  };
  [event.tokenLauncherAbandoned]: TokenLauncherAnalyticsParams;
  [event.tokenLauncherTokenCreated]: TokenLauncherAnalyticsParams;
  [event.tokenLauncherSharePressed]: TokenLauncherAnalyticsParams & {
    url: string;
  };

  [event.networkStatusOffline]: undefined;
  [event.networkStatusReconnected]: undefined;

  // wallet initialization
  [event.walletInitializationFailed]: {
    error: string;
    walletStatus: string;
  };

  // performance
  [event.performanceInitializeWallet]: {
    walletStatus: string;
    durationInMs: number;
    performanceTrackingVersion: number;
  };
  [event.performanceReport]: {
    reportName: string;
    segments: Record<string, number>;
    durationInMs: number;
    performanceTrackingVersion: number;
    data: Record<string, unknown>;
  };

  // discover screen
  [event.timeSpentOnDiscoverScreen]: {
    durationInMs: number;
  };

  [event.ensInitiatedRegistration]: { category: string };
  [event.ensEditedRecords]: { category: string };
  [event.ensCompletedRegistration]: { category: string };
  [event.ensExtended]: { category: string };
  [event.ensTransferredControl]: { category: string };
  [event.ensSetPrimary]: { category: string };
  [event.ensRapFailed]: { category: string; failed_action: ENSRapActionType; label: string };
  [event.ensRapStarted]: { category: string; label: string };
  [event.ensRapCompleted]: { category: string; label: string };

  [event.backupError]: { category: string; error: string; label: string };
  [event.backupSavedPassword]: undefined;
  [event.backupSkippedPassword]: undefined;
  [event.backupComplete]: { category: string; label: string };
  [event.backupConfirmed]: undefined;
  [event.backupSheetShown]: { category: string; label: string };
  [event.backupChoosePassword]: { category: string; label: string };

  [event.qrCodeScannedAddress]: undefined;
  [event.qrCodeScannedProfile]: undefined;
  [event.qrCodeScannedWalletConnect]: undefined;
  [event.qrCodeScannedInvalid]: { qrCodeData: string };

  [event.navigationAddCash]: { category: string };
  [event.navigationSwap]: { category: string };
  [event.navigationSend]: { category: string };
  [event.navigationMyQrCode]: { category: string };

  [event.walletProfileCancelled]: undefined;
  [event.walletProfileSubmitted]: undefined;

  [event.welcomeNewWallet]: undefined;
  [event.welcomeAlreadyHave]: undefined;

  [event.discoverTapSearch]: {
    category: string;
  };

  [event.applicationBecameInteractive]: undefined;
  [event.changedLanguage]: { language: string };
  [event.changedNativeCurrency]: { currency: string };
  [event.changedNetwork]: { chainId: number };
  [event.excludedFromFeaturePromo]: { campaign: string; exclusion: string; type: string };
  [event.manuallyDisconnectedFromWalletConnectConnection]: { dappName: string; dappUrl: string };
  [event.receivedWcConnection]: { dappName: string; dappUrl: string; waitingTime?: string | number };
  [event.resetAssetSelectionSend]: undefined;
  [event.searchQuery]: { category: string; length: number; query: string };
  [event.showSecretView]: { category: string };
  [event.shownWalletconnectSessionRequest]: undefined;
  [event.tappedAddExistingWallet]: undefined;
  [event.tappedCreateNewWallet]: undefined;
  [event.tappedDeleteWallet]: undefined;
  [event.tappedEdit]: undefined;
  [event.tappedWatchAddress]: undefined;
  [event.toggledAnNFTAsHidden]: {
    isHidden: boolean;
    collectionContractAddress?: string | null;
    collectionName?: string;
  };
  [event.viewedEnsProfile]: {
    category: string;
    ens: string;
    from: string;
    address?: string;
  };
  [event.viewedFeaturePromo]: { campaign: string };
  [event.viewedProfile]: {
    category: string;
    fromRoute: string;
    name: string;
  };
  [event.showWalletProfileModalForENSAddress]: {
    address: string;
    input: string;
  };
  [event.showWalletProfileModalForUnstoppableAddress]: {
    address: string;
    input: string;
  };
  [event.showWalletProfileModalForReadOnlyWallet]: {
    ens: string;
    input: string;
  };
  [event.showWalletProfileModalForImportedWallet]: {
    address: string;
    type: string;
  };
  [event.importedSeedPhrase]: {
    isWalletEthZero: boolean;
  };
  [event.iCloudNotEnabled]: {
    category: string;
  };
  [event.viewHowToEnableICloud]: {
    category: string;
  };
  [event.ignoreHowToEnableICloud]: {
    category: string;
  };
  [event.errorDuringICloudBackup]: {
    category: string;
    error: string;
    label: string;
  };
  [event.errorDuringGoogleDriveBackup]: {
    category: string;
    error: string;
    label: string;
  };
  [event.errorUpdatingBackupStatus]: {
    category: string;
    label: string;
  };
  [event.changedNativeCurrencyInputSend]: undefined;
  [event.changedTokenInputSend]: undefined;
  [event.sentTransaction]: {
    assetName: string;
    network: string;
    isRecepientENS: boolean;
    isHardwareWallet: boolean;
  };
  [event.tappedDoneEditingWallet]: {
    wallet_label: string;
  };
  [event.tappedCancelEditingWallet]: undefined;
  [event.tappedEditWallet]: undefined;
  [event.tappedNotificationSettings]: undefined;
  [event.tappedDeleteWalletConfirm]: undefined;
  [event.tappedEdit]: undefined;
  [event.tappedDeleteWallet]: undefined;
  [event.setAppIcon]: {
    appIcon: string;
  };
  [event.tappedImportButton]: undefined;
};
