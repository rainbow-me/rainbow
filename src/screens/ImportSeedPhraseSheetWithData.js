import { get } from 'lodash';
import { pure } from 'recompact';
import { deviceUtils } from '../utils';
import ImportSeedPhraseSheet from './ImportSeedPhraseSheet';

const ImportSeedPhraseSheetWithData = pure(ImportSeedPhraseSheet);

ImportSeedPhraseSheetWithData.navigationOptions = ({ navigation }) => ({
  gestureEnabled: get(navigation, 'state.params.gestureEnabled', true),
  gestureResponseDistance: {
    vertical: deviceUtils.dimensions.height / 2,
  },
});

export default ImportSeedPhraseSheetWithData;
