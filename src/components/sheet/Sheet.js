import PropTypes from 'prop-types';
import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useNavigation } from 'react-navigation-hooks';
import { borders, colors } from '../../styles';
import TouchableBackdrop from '../TouchableBackdrop';
import { Centered, Column } from '../layout';
import SheetHandle from './SheetHandle';

const Sheet = ({ children }) => {
  const { goBack } = useNavigation();
  const insets = useSafeArea();

  return (
    <Column height="100%" justify="end">
      <TouchableBackdrop onPress={goBack} />
      <Column
        backgroundColor={colors.white}
        css={borders.buildRadius('top', 39)}
        paddingBottom={insets.bottom}
      >
        <Centered paddingBottom={15} paddingTop={6}>
          <SheetHandle />
        </Centered>
        {children}
      </Column>
    </Column>
  );
};

Sheet.propTypes = {
  children: PropTypes.node,
};

export default Sheet;
