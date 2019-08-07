import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import FastImage from 'react-native-fast-image';
import { View } from 'react-native';
import { colors, padding } from '../../styles';
import {
  Column,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Monospace, Text } from '../text';
import RotationArrow from '../animations/RotationArrow';
import Caret from '../../assets/family-dropdown-arrow.png';

const HeaderHeight = 48;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 15)};
  height: ${HeaderHeight};
`;

const SettingIconWrap = styled(View)`
  padding-left: 10px;
`;

const SettingIcon = styled(FastImage)`
  height: 13.5px;
  width: 6.5px;
`;

class InvestmentCardHeader extends React.Component {
  render() {
    const {
      collapsed,
      color,
      emoji,
      isCollapsible,
      title,
      titleColor,
      value,
    } = this.props;

    return (
      <Container>
        <Row align="center">
          <Column
            align="start"
            justify="center"
            width={24}
          >
            <Emoji
              name={emoji}
              lineHeight="none"
              size="smedium"
            />
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
          <Monospace
            color={color}
            size="lmedium"
            weight="medium"
          >
            {value}
          </Monospace>
          {isCollapsible && (
            <SettingIconWrap>
              <RotationArrow isOpen={!collapsed} endingPosition={90}>
                <SettingIcon source={Caret} />
              </RotationArrow>
            </SettingIconWrap>
          )}
        </RowWithMargins>
      </Container>
    );
  }
}

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

InvestmentCardHeader.height = HeaderHeight;

export default InvestmentCardHeader;
