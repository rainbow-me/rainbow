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
import { withDataInit, withIsWalletEmpty } from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';
import { isValidSeedPhrase as validateSeedPhrase } from '../helpers/validators';

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
  withDataInit,
  withIsWalletEmpty,
  withNavigation,
  withState('clipboardContents', 'setClipboardContents', ''),
  withState('isImporting', 'setIsImporting', false),
  withState('seedPhrase', 'setSeedPhrase', ''),
  withHandlers({
    importSeedPhrase: ({
      clearAccountData,
      initializeWallet,
      isEmpty,
      navigation,
      seedPhrase,
      setIsImporting,
    }) => async () => {
      await clearAccountData();

      return initializeWallet(seedPhrase.trim())
        .then((address) => {
          if (address) {
            analytics.track('Imported seed phrase', {
              hadPreviousAddressWithValue: isEmpty,
            });
            setIsImporting(false);
            navigation.navigate('WalletScreen');
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
    getClipboardContents: ({ setClipboardContents }) => async () => Clipboard.getString().then(setClipboardContents),
    onImportSeedPhrase: ({ setIsImporting }) => () => ConfirmImportAlert(() => setIsImporting(true)),
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
    isClipboardContentsValidSeedPhrase: validateSeedPhrase(clipboardContents),
    isSeedPhraseValid: validateSeedPhrase(seedPhrase),
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
