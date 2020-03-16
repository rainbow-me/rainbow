import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { View } from 'react-primitives';
import { pure } from 'recompact';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { Column, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import { RotationArrow } from '../animations';

const height = 49;

const InvestmentCardHeader = pure(
  ({ collapsed, color, emoji, isCollapsible, title, titleColor, value }) => (
    <Row
      align="center"
      height={height}
      justify="space-between"
      paddingHorizontal={15}
    >
      <RowWithMargins align="center" margin={3} paddingBottom={3}>
        <Column align="start" justify="center" width={24}>
          <Emoji
            name={emoji}
            lineHeight="none"
            style={{ paddingBottom: 1.5 }}
            size="medium"
          />
        </Column>
        <Text
          color={titleColor || color}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          {title}
        </Text>
      </RowWithMargins>
      <Row align="center" paddingBottom={3}>
        <Text
          color={color}
          letterSpacing="roundedTight"
          size="lmedium"
          weight="semibold"
        >
          {value}
        </Text>
        {isCollapsible && (
          <View paddingLeft={12} paddingRight={4}>
            <RotationArrow isOpen={!collapsed} endingPosition={90}>
              <FastImage
                source={Caret}
                style={{
                  height: 17,
                  width: 9,
                }}
              />
            </RotationArrow>
          </View>
        )}
      </Row>
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
