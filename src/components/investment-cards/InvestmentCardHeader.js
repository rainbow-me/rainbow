import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { StyleSheet, View } from 'react-primitives';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { RotationArrow } from '../animations';
import { Column, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const InvestmentCardHeaderHeight = 49;

const sx = StyleSheet.create({
  caret: {
    height: 17,
    width: 9,
  },
  emoji: {
    paddingBottom: 1.5,
  },
});

// eslint-disable-next-line react/display-name
const InvestmentCardHeader = React.memo(
  ({ collapsed, color, emoji, isCollapsible, title, titleColor, value }) => (
    <Row
      align="center"
      height={InvestmentCardHeaderHeight}
      justify="space-between"
      paddingHorizontal={15}
    >
      <RowWithMargins align="center" margin={3} paddingBottom={3}>
        <Column align="start" justify="center" width={24}>
          <Emoji
            lineHeight="none"
            name={emoji}
            size="medium"
            style={sx.emoji}
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
            <RotationArrow endingPosition={90} isOpen={!collapsed}>
              <FastImage source={Caret} style={sx.caret} />
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

InvestmentCardHeader.height = InvestmentCardHeaderHeight;

export default InvestmentCardHeader;
