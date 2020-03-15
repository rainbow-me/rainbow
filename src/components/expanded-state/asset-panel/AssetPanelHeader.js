import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../../styles';
import { ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';

const Container = styled(ColumnWithMargins).attrs({
  justify: 'start',
  margin: 4,
})`
  ${padding(15, FloatingPanel.padding.x)};
  height: 75;
`;

const HeaderRow = withProps({
  align: 'center',
  justify: 'space-between',
})(Row);

const HeadingTextStyles = {
  color: colors.dark,
  size: 'larger',
};

const Price = withProps(HeadingTextStyles)(Text);

const Subtitle = withProps({
  color: colors.blueGreyDark,
  lineHeight: 'tight',
  size: 'smedium',
  weight: 'medium',
})(TruncatedText);

const Title = styled(TruncatedText).attrs(HeadingTextStyles)`
  flex: 1;
  padding-right: ${({ paddingRight }) => paddingRight};
`;

const AssetPanelHeader = ({ price, priceLabel, subtitle, title }) => (
  <Container>
    <HeaderRow>
      <Title
        paddingRight={price ? FloatingPanel.padding.x * 1.25 : 0}
        weight="bold"
      >
        {title}
      </Title>
      {price && (
        <Price align="right" letterSpacing="roundedTight" weight="semibold">
          {price}
        </Price>
      )}
    </HeaderRow>
    <HeaderRow style={{ opacity: 0.5 }}>
      <Subtitle>{subtitle}</Subtitle>
      {price && (
        <Subtitle align="right">{priceLabel || 'Current Price'}</Subtitle>
      )}
    </HeaderRow>
  </Container>
);

AssetPanelHeader.propTypes = {
  price: PropTypes.string,
  priceLabel: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default onlyUpdateForPropTypes(AssetPanelHeader);
