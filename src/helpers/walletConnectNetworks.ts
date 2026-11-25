import { type MenuActionConfig } from '@/components/native-context-menu/contextMenu';
import * as i18n from '@/languages';

/** Lists the actions available for a WalletConnect connection. */
export const changeConnectionMenuItems = (): MenuActionConfig[] => {
  return [
    {
      actionKey: 'disconnect',
      actionTitle: i18n.t(i18n.l.walletconnect.menu_options.disconnect),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'xmark.square',
      },
      menuAttributes: ['destructive'],
    },
    {
      actionKey: 'switch-account',
      actionTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_wallet),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'rectangle.stack.person.crop',
      },
    },
  ];
};
