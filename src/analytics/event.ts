import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';
import { FiatProviderName } from '@/entities/f2c';
import { Network } from '@/helpers';
import WalletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import {
  NotificationRelationshipType,
  NotificationTopicType,
} from '@/notifications/settings';
import { ProtocolShare } from '@rainbow-me/swaps';

interface IndexedProtocolShare extends ProtocolShare {
  [key: string]: number | string;
}

/**
 * All events, used by `analytics.track()`
 */
export const event = {
  execJSBundle: 'js_bundle.exec',
  firstAppOpen: 'app.first_open',
  applicationDidMount: 'app.mounted',
  applicationSplashScreenDismissed: 'app.splash_screen.dismissed',
  applicationInternetDisconnected: 'app.internet_disconnected',
  applicationInternetConnected: 'app.internet_connected',
  applicationSecretViewShown: 'app.secret_view.shown',
  appIconSet: 'app_icon.set',
  appIconUnlockViewed: 'app_icon_unlock.viewed',
  appIconUnlockActivated: 'app_icon_unlock.activated',
  appIconUnlockDismissed: 'app_icon_unlock.dismissed',
  appStateChange: 'app_state.change',
  analyticsTrackingDisabled: 'analytics_tracking.disabled',
  analyticsTrackingEnabled: 'analytics_tracking.enabled',
  promoSheetShown: 'promo_sheet.shown',
  promoSheetDismissed: 'promo_sheet.dismissed',
  promoSheetExcluded: 'promo_sheet.excluded',
  profileViewed: 'profile.viewed',
  profileViewedENS: 'profile.viewed.ens',
  profileViewedUnstoppable: 'profile.viewed.unstoppable',
  profileViewedReadOnly: 'profile.viewed.read_only',
  profileViewedImported: 'profile.viewed.imported',

  ensRegistrationInitiated: 'ens.registration.initiated',
  ensRegistrationCompleted: 'ens.registration.completed',
  ensRegistrationExtended: 'ens.registration.extended',
  ensRecordEdited: 'ens.record.edited',
  ensRecordTransferred: 'ens.record.transferred',
  ensRecordSetToPrimary: 'ens.record.set_to_primary',

  rapStarted: 'rap.started',
  rapCompleted: 'rap.completed',
  rapFailed: 'rap.failed',

  backupStarted: 'backup.started',
  backupCompleted: 'backup.completed',
  backupFailed: 'backup.failed',
  backupNeedsBackupView: 'backup.needs_backup_view',
  backupAlreadyBackedUpView: 'backup.already_backed_up_view',
  backupToCloudPressed: 'backup.to_cloud_pressed',
  backupManualBackupPressed: 'backup.manual_backup_pressed',
  backupErrorUpdatingStatus: 'backup.error_updating_status',
  backupChoosePasswordStep: 'backup.choose_password_step',
  backupConfirmPasswordStep: 'backup.confirm_password_step',
  backupSecretSaved: 'backup.secret_saved',
  backupManualBackupStep: 'backup.viewed_manual_backup_step',
  backupIcloudNotEnabled: 'backup.icloud_not_enabled',
  backupViewedHowToEnableIcloud: 'backup.viewed_how_to_enable_icloud',
  backupDismissedHowToEnableIcloud: 'backup.dismissed_how_to_enable_icloud',
  backupSavedToCloud: 'backup.saved_to_cloud',
  backupErrorSavingToCloud: 'backup.error_saving_to_cloud',

  swapSubmitted: 'swap.submitted',
  swapSuccessful: 'swap.successful',
  swapFailed: 'swap.failed',
  swapSearchResultSelected: 'swap.search_result_selected',
  swapSettingsOpened: 'swap.settings_opened',
  swapViewOpened: 'swap.view_opened',
  swapHighPriceImpactWarning: 'swap.high_price_impact_warning',
  swapUpdatedDetails: 'swap.updated_details',
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
  notificationsTappedPushNotification: 'notifications.tapped_push_notification',
  notificationsChangedNotificationSettings:
    'notifications.changed_notification_settings',
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

  wcDisconnected: 'wc.disconnected',
  wcNewPairing: 'wc.new_pairing',
  wcNewPairingTimeout: 'wc.new_pairing_timeout',
  wcNewSessionTimeout: 'wc.new_session_timeout',
  wcNewSessionRejected: 'wc.new_session_rejected',
  wcNewSessionApproved: 'wc.new_session_approved',
  wcNewSessionError: 'wc.new_session_error',
  wcShowingSigningRequest: 'wc.showing_signing_request',
  wcShownSigningRequest: 'wc.shown_signing_request',
  wcShowingSessionRequest: 'wc.showing_session_request',
  wcShownSessionRequest: 'wc.shown_session_request',
  wcReceivedConnectionRequest: 'wc.received_connection_request',
  wcRejectedTransactionRequest: 'wc.rejected_transaction_request',
  wcApprovedTransactionRequest: 'wc.approved_transaction_request',
  wcCallRequestError: 'wc.call_request_error',
  wcNewChainApproved: 'wc.new_chain_approved',
  wcNewChainRejected: 'wc.new_chain_rejected',

  languageChanged: 'language.changed',
  currencyChanged: 'currency.changed',
  currencyChangedInput: 'currency.changed_input',
  tokenInputChanged: 'token_input.changed',
  resetAssetSelection: 'asset_selection.reset',

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
  networkChanged: 'network.changed',
  nftHideToken: 'nft.hide_token',

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
  qrCodeAddressScanned: 'qr_code.address_scanned',
  qrCodeRainbowProfileScanned: 'qr_code.rainbow_profile_scanned',
  qrCodeWalletConnectScanned: 'qr_code.wallet_connect_scanned',
  qrCodeUnsupportedScan: 'qr_code.unsupported_scan',

  searchQuery: 'search.query',
  walletImported: 'wallet.imported',
  transactionSent: 'transaction.sent',
  gasPriceUpdated: 'gas_price.updated',
} as const;

/**
 * Properties corresponding to each event
 */
export type EventProperties = Partial<{
  [event.execJSBundle]: undefined;
  [event.firstAppOpen]: undefined;
  [event.applicationDidMount]: undefined;
  [event.applicationSplashScreenDismissed]: {
    time: number;
  };
  [event.applicationInternetDisconnected]: {
    time: number;
  };
  [event.applicationInternetConnected]: {
    time: number;
  };
  [event.applicationSecretViewShown]: {
    category: string;
  };
  [event.appIconSet]: {
    appIcon: string;
  };
  [event.appIconUnlockViewed]: {
    campaign: string;
  };
  [event.appIconUnlockActivated]: {
    campaign: string;
  };
  [event.appIconUnlockDismissed]: {
    campaign: string;
  };
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

  [event.backupStarted]: {
    category: string;
    label: string;
  };
  [event.backupCompleted]: {
    category: string;
    label: string;
  };
  [event.backupFailed]: {
    category: string;
    error: string;
    label: string;
  };
  [event.backupErrorUpdatingStatus]: {
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
  [event.backupManualBackupStep]: {
    category: string;
    label: string;
  };
  [event.backupIcloudNotEnabled]: {
    category: string;
  };
  [event.backupToCloudPressed]: {
    category: string;
    platform: string;
  };
  [event.backupViewedHowToEnableIcloud]: {
    category: string;
  };
  [event.backupDismissedHowToEnableIcloud]: {
    category: string;
  };
  [event.backupSecretSaved]: {
    type: typeof WalletTypes;
  };
  [event.backupAlreadyBackedUpView]: {
    category: string;
  };
  [event.backupNeedsBackupView]: {
    category: string;
  };
  [event.backupSavedToCloud]: {
    time: number;
  };
  [event.backupErrorSavingToCloud]: {
    time: number;
  };
  [event.backupManualBackupPressed]: {
    category: string;
  };

  [event.languageChanged]: {
    language: string;
  };

  [event.currencyChanged]: {
    currency: string;
  };

  [event.ensRegistrationInitiated]: {
    category: string;
  };

  [event.ensRecordEdited]: {
    category: string;
  };

  [event.ensRegistrationCompleted]: {
    category: string;
  };

  [event.ensRegistrationExtended]: {
    category: string;
  };

  [event.ensRecordTransferred]: {
    category: string;
  };

  [event.ensRecordSetToPrimary]: {
    category: string;
  };

  [event.rapStarted]: {
    category: string;
    label: string;
  };

  [event.rapFailed]: {
    category: string;
    failed_action: string;
    label: string;
  };

  [event.rapCompleted]: {
    category: string;
    label: string;
  };

  [event.swapSubmitted]: {
    usdValue: number;
    inputCurrencySymbol: string;
    outputCurrencySymbol: string;
  };
  [event.swapSuccessful]: {
    aggregator: string;
    amountInUSD: any;
    gasSetting: string;
    inputTokenAddress: string;
    inputTokenName: string;
    inputTokenSymbol: string;
    isHardwareWallet: boolean;
    isHighPriceImpact: boolean;
    legacyGasPrice: string;
    liquiditySources: string;
    maxNetworkFee: string;
    network: Network;
    networkFee: string;
    outputTokenAddress: string;
    outputTokenName: string;
    outputTokenSymbol: string;
    priceImpact: string | null | undefined;
    slippage: number | string;
    type: string;
  };
  [event.swapSearchResultSelected]: {
    name: string;
    searchQueryForSearch: string;
    symbol: string;
    tokenAddress: string;
    type: string;
  };
  [event.swapSettingsOpened]: undefined;
  [event.swapViewOpened]: {
    inputTokenAddress: string;
    inputTokenName: string;
    inputTokenSymbol: string;
    outputTokenAddress: string;
    outputTokenName: string;
    outputTokenSymbol: string;
    type: string;
  };
  [event.swapHighPriceImpactWarning]: {
    name: string;
    priceImpact: string | null | undefined;
    symbol: string;
    tokenAddress: string;
    type: string;
  };
  [event.swapUpdatedDetails]: {
    aggregator: string;
    inputTokenAddress: string;
    inputTokenName: string;
    inputTokenSymbol: string;
    liquiditySources: IndexedProtocolShare[];
    network: Network;
    outputTokenAddress: string;
    outputTokenName: string;
    outputTokenSymbol: string;
    slippage: number | string;
    type: string;
  };

  [event.profileViewed]: {
    category: string;
    fromRoute: string;
    name: string;
  };
  [event.profileViewedENS]:
    | {
        address: string;
        input: string;
      }
    | {
        category: string;
        ens: string;
        from: string;
      };
  [event.profileViewedUnstoppable]: {
    address: string;
    input: string;
  };
  [event.profileViewedReadOnly]: {
    ens: string;
    input: string;
  };
  [event.profileViewedImported]: {
    address: string;
    type: EthereumWalletType;
  };

  [event.promoSheetShown]: {
    campaign: string;
    time_viewed: number;
  };
  [event.promoSheetDismissed]: {
    campaign: string;
    time_viewed: number;
  };
  [event.promoSheetExcluded]: {
    campaign: string;
    exclusion: string;
    type: string;
  };
  [event.notificationsPromoShown]: undefined;
  [event.notificationsTappedPushNotification]: {
    campaign: {
      name: string;
      medium: string;
    };
  };
  [event.notificationsChangedNotificationSettings]: {
    chainId: number;
    topic: NotificationTopicType;
    type: NotificationRelationshipType;
    action: 'subscribe' | 'unsubscribe';
  };
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

  [event.wcDisconnected]: {
    dappName: string;
    dappUrl: string;
  };
  [event.wcNewPairing]: {
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcNewPairingTimeout]: undefined;
  [event.wcNewSessionApproved]: {
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcNewSessionTimeout]: {
    bridge: string;
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcNewSessionRejected]: {
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcNewSessionError]: {
    type: string;
    error?: any;
    payload?: any;
  };
  [event.wcShowingSessionRequest]: {
    dappName: string;
    dappUrl: string;
    connector?: string;
  };
  [event.wcShownSigningRequest]: undefined;
  [event.wcShowingSigningRequest]: {
    dappName?: string;
    dappUrl?: string;
    connector?: string;
  };
  [event.wcReceivedConnectionRequest]: {
    dappName: string;
    dappUrl: string;
    waitingTime: number | string;
  };
  [event.wcRejectedTransactionRequest]: {
    isHardwareWallet: boolean;
    type: string;
  };
  [event.wcApprovedTransactionRequest]: {
    dappName: string;
    dappUrl: string;
    isHardwareWallet: boolean;
    network: Network | null | undefined;
    type: 'transaction' | 'signature';
  };
  [event.wcCallRequestError]: {
    error?: any;
    payload?: any;
  };
  [event.wcNewChainApproved]: {
    chainId: string;
    dappName?: string;
    dappUrl?: string;
  };
  [event.wcNewChainRejected]: {
    dappName?: string;
    dappUrl?: string;
  };
  [event.nftHideToken]: {
    collectionContractAddress: string | null;
    collectionName: string;
    isHidden: boolean;
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
  [event.networkChanged]: {
    network: Network;
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
  [event.qrCodeAddressScanned]: undefined;
  [event.qrCodeRainbowProfileScanned]: undefined;
  [event.qrCodeWalletConnectScanned]: undefined;
  [event.qrCodeUnsupportedScan]: {
    qrCodeData: string;
  };
  [event.searchQuery]: {
    category: string;
    length: number;
    query: string;
  };

  [event.walletImported]: {
    type: EthereumWalletType;
    nonZeroBalance: boolean;
  };

  [event.transactionSent]: {
    assetName: string;
    assetType: string;
    isRecipientENS: boolean;
    isHardwareWallet: boolean;
  };

  [event.gasPriceUpdated]: {
    gasPriceOption: string;
  };
}>;
