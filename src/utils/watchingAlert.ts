import { Alert } from 'react-native';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function watchingAlert() {
  Alert.alert(
    `This wallet is currently in "Watching" mode!`,
    `
It looks like you imported this wallet using only its public address. In order to control what's inside, you'll need to import the private key or secret phrase first.`,
    [
      {
        onPress: () => {
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-3 arguments, but got 1.
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
