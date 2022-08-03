import lang from 'i18n-js';
import Alert from '@/helpers/alert';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function watchingAlert() {
  Alert.alert(
    lang.t('wallet.alert.this_wallet_in_watching_mode'),
    lang.t('wallet.alert.looks_like_imported_public_address'),
    [
      {
        onPress: () => {
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
          Navigation.handleAction(Routes.IMPORT_SEED_PHRASE_FLOW);
        },
        text: lang.t('wallet.alert.finish_importing'),
      },
      {
        text: lang.t('wallet.alert.nevermind'),
      },
    ]
  );
}
