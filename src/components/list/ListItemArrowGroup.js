import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { pure } from 'recompact';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const ListItemArrowGroup = ({ children }) => (
  <RowWithMargins
    align="center"
    flex={0}
    justify="end"
    margin={7}
    opacity={0.6}
  >
    {typeof children === 'string' ? (
      <Text color="blueGreyDark" size="large">
        {children}
      </Text>
    ) : (
      children
    )}
    <FastImage
      source={Caret}
      style={{
        height: 17,
        marginTop: 0.5,
        width: 9,
      }}
      tintColor={colors.blueGreyDark}
    />
  </RowWithMargins>
);

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default pure(ListItemArrowGroup);
