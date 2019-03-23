import { get } from 'lodash';
import { isValidSeedPhrase as validateSeedPhrase } from '@rainbow-me/rainbow-common';
import { Clipboard, InteractionManager, Linking } from 'react-native';
import { withNavigation } from 'react-navigation';
import {
  compose,
  lifecycle,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { Alert } from '../components/alerts';
import { withAccountRefresh, withAccountReset } from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';

const ConfirmImportAlert = onSuccess => (
  Alert({
    buttons: [{
      onPress: onSuccess,
      text: 'Import',
    }, {
      style: 'cancel',
      text: 'Cancel',
    }],
    // eslint-disable-next-line
    message: 'Importing this seed phrase will overwrite your existing wallet. Before continuing, please make sure you’ve transferred its contents or backed up its seed phrase.',
    title: 'Are you sure you want to import?',
  })
);

const ImportSeedPhraseSheetWithData = compose(
  withAccountReset,
  withAccountRefresh,
  withNavigation,
  withState('clipboardContents', 'setClipboardContents', ''),
  withState('isImporting', 'setIsImporting', false),
  withState('seedPhrase', 'setSeedPhrase', ''),
  withHandlers({
    importSeedPhrase: ({
      accountClearState,
      navigation,
      refreshAccount,
      screenProps,
      seedPhrase,
      setIsImporting,
    }) => () => {
      accountClearState();

      return screenProps
        .handleWalletConfig(seedPhrase.trim())
        .then((address) => {
          if (address) {
            refreshAccount()
              .then(() => {
                setIsImporting(false);
                navigation.navigate('WalletScreen');
              });
          } else {
            setIsImporting(false);
          }
        })
        .catch((error) => {
          setIsImporting(false);
          console.error('error importing seed phrase: ', error);
        });
    },
  }),
  withHandlers({
    onImportSeedPhrase: ({ setIsImporting }) => () => ConfirmImportAlert(() => setIsImporting(true)),
    onInputChange: ({ setSeedPhrase }) => ({ nativeEvent }) => setSeedPhrase(nativeEvent.text),
    onPasteSeedPhrase: ({ setSeedPhrase }) => () => {
      Clipboard.getString()
        .then(setSeedPhrase)
        .catch(error => console.log(error));
    },
    onPressHelp: () => () => Linking.openURL('http://rainbow.me'),
  }),
  lifecycle({
    componentDidMount() {
      InteractionManager.runAfterInteractions(async () => {
        const { setClipboardContents } = this.props;
        await Clipboard.getString().then(setClipboardContents);
      });
    },
    componentDidUpdate(prevProps) {
      const { isImporting, navigation, importSeedPhrase } = this.props;

      if (isImporting !== prevProps.isImporting) {
        navigation.setParams({ gesturesEnabled: !isImporting });
      }

      if (!prevProps.isImporting && isImporting) {
        InteractionManager.runAfterInteractions(importSeedPhrase);
      }
    },
  }),
  withHandlers({
    onPressEnterKey: ({ onImportSeedPhrase, seedPhrase }) => ({ nativeEvent: { key } }) => {
      if (seedPhrase) {
        onImportSeedPhrase();
      }
    },
  }),
  withProps(({ clipboardContents, seedPhrase }) => ({
    isClipboardContentsValidSeedPhrase: validateSeedPhrase(clipboardContents),
    isSeedPhraseValid: validateSeedPhrase(seedPhrase),
  })),
  onlyUpdateForKeys([
    'isClipboardContentsValidSeedPhrase',
    'isImporting',
    'isSeedPhraseValid',
    'seedPhrase',
  ]),
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  effect: 'sheet',
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
  gesturesEnabled: get(navigation, 'state.params.gesturesEnabled', true),
});

export default ImportSeedPhraseSheetWithData;
