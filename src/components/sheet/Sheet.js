import PropTypes from 'prop-types';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '../../navigation/Navigation';
import { useTheme } from '../../theme/ThemeContext';

import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import SheetHandle from './SheetHandle';
import { useDimensions } from '@/hooks';
import { borders } from '@/styles';

const Sheet = ({ borderRadius, children, hideHandle, noInsets = false, paddingBottom = 7, paddingTop = 6 }) => {
  const { width } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Column height="100%" justify="end" width={width}>
      <TouchableBackdrop onPress={goBack} />
      <Column
        backgroundColor={colors.white}
        paddingBottom={noInsets ? 0 : insets.bottom}
        style={borders.buildRadiusAsObject('top', borderRadius)}
        width="100%"
      >
        <Centered paddingBottom={paddingBottom} paddingTop={paddingTop}>
          {!hideHandle && <SheetHandle />}
        </Centered>
        {children}
      </Column>
    </Column>
  );
};

Sheet.propTypes = {
  borderRadius: PropTypes.number,
  hideHandle: PropTypes.bool,
};

Sheet.defaultProps = {
  borderRadius: 39,
};

export default Sheet;
