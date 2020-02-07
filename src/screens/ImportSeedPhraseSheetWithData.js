import { get } from 'lodash';
import { compose } from 'recompact';
import {
  withDataInit,
  withIsWalletEmpty,
  withIsWalletImporting,
  withAccountAddress,
} from '../hoc';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';

const ImportSeedPhraseSheetWithData = compose(
  withDataInit,
  withIsWalletEmpty,
  withIsWalletImporting,
  withAccountAddress
)(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
  gesturesEnabled: get(navigation, 'state.params.gesturesEnabled', true),
});

export default ImportSeedPhraseSheetWithData;
