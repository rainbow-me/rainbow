import * as i18n from '@/languages';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export default function watchingAlert() {
  Alert.alert(i18n.t(i18n.l.wallet.alert.this_wallet_in_watching_mode), i18n.t(i18n.l.wallet.alert.looks_like_imported_public_address), [
    {
      onPress: () => {
        Navigation.handleAction(Routes.ADD_WALLET_NAVIGATOR, {
          screen: Routes.IMPORT_OR_WATCH_WALLET_SHEET,
          params: { type: 'import', isFirstWallet: false },
        });
      },
      text: i18n.t(i18n.l.wallet.alert.finish_importing),
    },
    {
      text: i18n.t(i18n.l.wallet.alert.nevermind),
    },
  ]);
}
