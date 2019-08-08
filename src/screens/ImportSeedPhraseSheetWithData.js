import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
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
import { withDataInit, withIsWalletEmpty, withIsWalletImporting } from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';
import { isValidSeed as validateSeed } from '../helpers/validators';

const ConfirmImportAlert = onSuccess => (
  Alert({
    buttons: [{
      onPress: onSuccess,
      style: 'destructive',
      text: 'Delete and Import',
    }, {
      style: 'cancel',
      text: 'Cancel',
    }],
    // eslint-disable-next-line
    message: 'Importing this private key will overwrite your existing wallet. Before continuing, please make sure you’ve transferred its contents or backed up its private key.',
    title: 'Are you sure you want to import?',
  })
);

const ImportSeedPhraseSheetWithData = compose(
  withDataInit,
  withIsWalletEmpty,
  withIsWalletImporting,
  withNavigation,
  withState('clipboardContents', 'setClipboardContents', ''),
  withState('seedPhrase', 'setSeedPhrase', ''),
  withHandlers({
    importSeedPhrase: ({
      initializeWallet,
      isEmpty,
      navigation,
      seedPhrase,
      setIsWalletImporting,
    }) => async () => {
      try {
        const address = await initializeWallet(seedPhrase.trim());
        if (address) {
          analytics.track('Imported seed phrase', {
            hadPreviousAddressWithValue: isEmpty,
          });
          setIsWalletImporting(false);
          navigation.navigate('WalletScreen');
        } else {
          setIsWalletImporting(false);
        }
      } catch (error) {
        setIsWalletImporting(false);
        console.error('error importing seed phrase: ', error);
      }
    },
  }),
  withHandlers({
    getClipboardContents: ({ setClipboardContents }) => async () => Clipboard.getString().then(setClipboardContents),
    onImportSeedPhrase: ({ setIsWalletImporting }) => () => ConfirmImportAlert(() => setIsWalletImporting(true)),
    onInputChange: ({ isImporting, setSeedPhrase }) => ({ nativeEvent }) => {
      if (!isImporting) {
        setSeedPhrase(nativeEvent.text);
      }
    },
    onPasteSeedPhrase: ({ setSeedPhrase }) => () => {
      Clipboard.getString()
        .then(setSeedPhrase)
        .catch(error => console.log(error));
    },
    onPressHelp: () => () => Linking.openURL('http://rainbow.me'),
  }),
  withProps(({ clipboardContents, seedPhrase }) => ({
    isClipboardContentsValidSeedPhrase: validateSeed(clipboardContents),
    isSeedPhraseValid: validateSeed(seedPhrase),
  })),
  onlyUpdateForKeys([
    'isClipboardContentsValidSeedPhrase',
    'isImporting',
    'isSeedPhraseValid',
    'seedPhrase',
  ]),
  lifecycle({
    componentDidMount() {
      this.props.getClipboardContents();
    },
    componentDidUpdate(prevProps) {
      const {
        getClipboardContents,
        importSeedPhrase,
        isImporting,
        navigation,
      } = this.props;

      getClipboardContents();

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
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  effect: 'sheet',
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
  gesturesEnabled: get(navigation, 'state.params.gesturesEnabled', true),
});

export default ImportSeedPhraseSheetWithData;
