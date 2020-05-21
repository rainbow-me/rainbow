import PropTypes from 'prop-types';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useNavigation } from 'react-navigation-hooks';
import { useDimensions } from '../../hooks';
import { borders, colors } from '../../styles';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import SheetHandle from './SheetHandle';

const Sheet = ({ borderRadius, children }) => {
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
          <SheetHandle />
        </Centered>
        {children}
      </Column>
    </Column>
  );
};

Sheet.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
};

Sheet.defaultProps = {
  borderRadius: 39,
};

export default Sheet;
