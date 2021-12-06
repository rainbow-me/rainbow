import { Alert } from 'react-native';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { Navigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

export default function watchingAlert() {
  Alert.alert(
    `This wallet is currently in "Watching" mode!`,
    `
It looks like you imported this wallet using only its public address. In order to control what's inside, you'll need to import the private key or secret phrase first.`,
    [
      {
        onPress: () => {
          Navigation.handleAction(Routes.IMPORT_SEED_PHRASE_FLOW);
        },
        text: 'Finish Importing',
      },
      {
        text: 'Nevermind',
      },
    ]
  );
}
