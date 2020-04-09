import { includes } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../../styles';
import { ColumnWithMargins, Row, Column } from '../../layout';
import { Text, TruncatedText } from '../../text';
import FloatingPanel from '../FloatingPanel';
import ContextMenu from '../../ContextMenu';
import { withShowcaseTokens } from '../../../hoc';
import store from '../../../redux/store';
import { uniqueTokensRefreshState } from '../../../redux/uniqueTokens';

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

const AssetPanelHeader = ({
  asset,
  price,
  priceLabel,
  subtitle,
  title,
  showcaseTokens,
  pushShowcaseToken,
  popShowcaseToken,
  navigation,
}) => (
  <Container>
    <Row style={{ justifyContent: 'space-between' }}>
      <Column flex={1}>
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
      </Column>
      {asset ? (
        <ContextMenu
          css={padding(0, 0, 3, 16)}
          destructiveButtonIndex={includes(showcaseTokens, asset.uniqueId) && 0}
          onPressActionSheet={index => {
            if (index === 0) {
              if (includes(showcaseTokens, asset.uniqueId)) {
                popShowcaseToken(asset.uniqueId);
              } else {
                pushShowcaseToken(asset.uniqueId);
              }
              store.dispatch(uniqueTokensRefreshState());
              if (navigation) {
                navigation.pop();
              }
            }
          }}
          options={
            includes(showcaseTokens, asset.uniqueId)
              ? ['Remove from Showcase', 'Cancel']
              : ['Add to Showcase', 'Cancel']
          }
        />
      ) : null}
    </Row>
  </Container>
);

AssetPanelHeader.propTypes = {
  price: PropTypes.string,
  priceLabel: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(withShowcaseTokens)(AssetPanelHeader);
