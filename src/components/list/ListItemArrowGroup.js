import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { pure } from 'recompact';
import Caret from '../../assets/family-dropdown-arrow.png';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const ListItemArrowGroup = ({ children }) => (
  <RowWithMargins align="center" flex={1} justify="end" margin={7}>
    {typeof children === 'string' ? (
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.6)}
        size="large"
        weight="medium"
      >
        {children}
      </Text>
    ) : (
      children
    )}
    <FastImage
      source={Caret}
      style={{
        height: 18,
        marginTop: 0.5,
        width: 8,
      }}
      tintColor={colors.alpha(colors.blueGreyDark, 0.6)}
    />
  </RowWithMargins>
);

ListItemArrowGroup.propTypes = {
  children: PropTypes.node,
};

export default pure(ListItemArrowGroup);
