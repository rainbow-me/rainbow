import PropTypes from 'prop-types';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useDimensions } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';

import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import SheetHandle from './SheetHandle';
import { borders, colors } from '@rainbow-me/styles';

const Sheet = ({ borderRadius, children, hideHandle }) => {
  const { width } = useDimensions();
  const { goBack } = useNavigation();
  const insets = useSafeArea();

  return (
    <Column height="100%" justify="end" width={width}>
      <TouchableBackdrop onPress={goBack} />
      <Column
        backgroundColor={colors.white}
        css={borders.buildRadius('top', borderRadius)}
        paddingBottom={insets.bottom}
        width="100%"
      >
        <Centered paddingBottom={7} paddingTop={6}>
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
