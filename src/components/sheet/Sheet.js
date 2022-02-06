import PropTypes from 'prop-types';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';

import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import SheetHandle from './SheetHandle';
import { useDimensions } from '@rainbow-me/hooks';
import { borders } from '@rainbow-me/styles';

const Sheet = ({
  borderRadius,
  children,
  hideHandle,
  noInsets,
  paddingBottom = 7,
  paddingTop = 6,
}) => {
  const { width } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeArea();
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
  children: PropTypes.node,
  hideHandle: PropTypes.bool,
};

Sheet.defaultProps = {
  borderRadius: 39,
};

export default Sheet;
