import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import CaretAsset from '../../assets/family-dropdown-arrow.png';
import { colors, padding } from '../../styles';
import { RotationArrow } from '../animations';
import { Column, Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const InvestmentCardHeaderHeight = 49;

const Caret = styled(FastImage).attrs({ source: CaretAsset })`
  height: 17;
  width: 9;
`;

const CaretContainer = styled.View`
  padding-left: 12;
  padding-right: 4;
`;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 15)};
  height: ${InvestmentCardHeaderHeight};
`;

const InvestmentCardEmoji = styled(Emoji).attrs({
  lineHeight: 'none',
  size: 'medium',
})`
  padding-bottom: 1.5;
`;

const Label = styled(Text).attrs({
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'semibold',
})``;

const InvestmentCardHeader = React.memo(
  ({ collapsed, color, emoji, isCollapsible, title, titleColor, value }) => (
    <Container>
      <RowWithMargins align="center" margin={3} paddingBottom={3}>
        <Column align="start" justify="center" width={24}>
          <InvestmentCardEmoji name={emoji} />
        </Column>
        <Label color={titleColor || color}>{title}</Label>
      </RowWithMargins>
      <Row align="center" paddingBottom={3}>
        <Label color={color}>{value}</Label>
        {isCollapsible && (
          <CaretContainer>
            <RotationArrow endingPosition={90} isOpen={!collapsed}>
              <Caret />
            </RotationArrow>
          </CaretContainer>
        )}
      </Row>
    </Container>
  )
);

InvestmentCardHeader.displayName = 'InvestmentCardHeader';

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
