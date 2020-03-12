import { get } from 'lodash';
import { compose, pure } from 'recompact';
import { withDataInit, withIsWalletEmpty, withAccountSettings } from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';

const ImportSeedPhraseSheetWithData = compose(
  withAccountSettings,
  withDataInit,
  withIsWalletEmpty,
  pure
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  gestureEnabled: get(navigation, 'state.params.gestureEnabled', true),
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
});

export default ImportSeedPhraseSheetWithData;
