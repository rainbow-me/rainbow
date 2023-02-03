import { CardType } from '@/components/cards/GenericCard';
import { LearnCategory } from '@/components/cards/utils/types';

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
};
