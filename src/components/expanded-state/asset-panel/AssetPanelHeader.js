import PropTypes from 'prop-types';
import React from 'react';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../../styles';
import { Column, Row } from '../../layout';
import { Text, TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';

const Container = styled(Column)`
  ${padding(15, FloatingPanel.padding.x)};
  height: 75;
`;

const HeaderRow = withProps({
  align: 'center',
  justify: 'space-between',
})(Row);

const HeadingTextStyles = {
  color: colors.blueGreyDark,
  family: 'SFProText',
  size: 'larger',
  weight: 'semibold',
};

const Price = withProps(HeadingTextStyles)(Text);

const Subtitle = withProps({
  color: colors.blueGreyDark,
  family: 'SFMono',
  size: 'smedium',
  weight: 'regular',
})(Text);

const Title = styled(TruncatedText).attrs(HeadingTextStyles)`
  flex: 1;
  padding-right: ${FloatingPanel.padding.x * 1.25};
`;

const AssetPanelHeader = ({
  price,
  priceLabel,
  subtitle,
  title,
}) => (
  <Container justify="start">
    <HeaderRow style={{ marginBottom: 4 }}>
      <Title>{title}</Title>
      {price && <Price>{price}</Price>}
    </HeaderRow>
    <HeaderRow style={{ opacity: 0.6 }}>
      <Subtitle>{subtitle}</Subtitle>
      {price && <Subtitle>{priceLabel || 'Price'}</Subtitle>}
    </HeaderRow>
  </Container>
);

AssetPanelHeader.propTypes = {
  price: PropTypes.string,
  priceLabel: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default AssetPanelHeader;
