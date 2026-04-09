import React from 'react';

import PropTypes from 'prop-types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useDimensions from '@/hooks/useDimensions';
import { borders } from '@/styles';

import { useNavigation } from '../../navigation/Navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Centered, Column } from '../layout';
import TouchableBackdrop from '../TouchableBackdrop';
import SheetHandle from './SheetHandle';

const Sheet = ({ borderRadius = 39, children, hideHandle = false, noInsets = false, paddingBottom = 7, paddingTop = 6 }) => {
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

export default Sheet;
