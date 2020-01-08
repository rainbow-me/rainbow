import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { View } from 'react-primitives';
import { pure } from 'recompact';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { Column, Row, RowWithMargins } from '../layout';
import { Emoji, Monospace, Text } from '../text';
import { RotationArrow } from '../animations';

const height = 48;

const InvestmentCardHeader = pure(
  ({ collapsed, color, emoji, isCollapsible, title, titleColor, value }) => (
    <Row
      align="center"
      height={height}
      justify="space-between"
      paddingHorizontal={15}
    >
      <Row align="center">
        <Column align="start" justify="center" width={24}>
          <Emoji name={emoji} lineHeight="none" size="smedium" />
        </Column>
        <Text
          color={titleColor || color}
          letterSpacing="tight"
          size="lmedium"
          weight="medium"
        >
          {title}
        </Text>
      </Row>
      <RowWithMargins align="center" margin={1}>
        <Monospace color={color} size="lmedium" weight="medium">
          {value}
        </Monospace>
        {isCollapsible && (
          <View paddingLeft={10}>
            <RotationArrow isOpen={!collapsed} endingPosition={90}>
              <FastImage
                source={Caret}
                style={{
                  height: 13.5,
                  width: 6.5,
                }}
              />
            </RotationArrow>
          </View>
        )}
      </RowWithMargins>
    </Row>
  )
);

InvestmentCardHeader.propTypes = {
  collapsed: PropTypes.bool,
  color: PropTypes.string,
  emoji: PropTypes.string,
  isCollapsible: PropTypes.bool,
  title: PropTypes.string,
  titleColor: PropTypes.string,
  value: PropTypes.string,
};

InvestmentCardHeader.defaultProps = {
  color: colors.dark,
  isCollapsible: false,
};

InvestmentCardHeader.height = height;

export default InvestmentCardHeader;
