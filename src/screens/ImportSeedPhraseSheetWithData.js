import { get } from 'lodash';
import { compose, pure } from 'recompact';
import { withDataInit, withIsWalletEmpty } from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';

const ImportSeedPhraseSheetWithData = compose(
  withDataInit,
  withIsWalletEmpty,
  pure
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
  gesturesEnabled: get(navigation, 'state.params.gesturesEnabled', true),
});

export default ImportSeedPhraseSheetWithData;
