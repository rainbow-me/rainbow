import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-native';
import Caret from '../../assets/family-dropdown-arrow.png';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const ListItemArrowGroup = ({ children }) => {
  const { colors } = useTheme();
  return (
    <RowWithMargins align="center" flex={1} justify="end" margin={7}>
      {typeof children === 'string' ? (
        <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="large" weight="medium">
          {children}
        </Text>
      ) : (
        children
      )}
      <Image
        source={Caret}
        style={{
          height: 18,
          marginTop: 0.5,
          tintColor: colors.alpha(colors.blueGreyDark, 0.6),
          width: 8,
        }}
      />
    </RowWithMargins>
  );
};

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default React.memo(ListItemArrowGroup);
