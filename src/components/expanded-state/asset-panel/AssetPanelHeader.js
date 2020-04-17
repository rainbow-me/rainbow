import { includes } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { LayoutAnimation } from 'react-native';
import { useDispatch } from 'react-redux';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { useShowcaseTokens } from '../../../hooks';
import { setOpenFamilyTabs } from '../../../redux/openStateSettings';
import { colors, padding } from '../../../styles';
import ContextMenu from '../../ContextMenu';
import { ColumnWithMargins, Row, Column } from '../../layout';
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
  navigation,
}) => {
  const dispatch = useDispatch();
  const {
    popShowcaseToken,
    pushShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();
  return (
    <Container>
      <Row style={{ justifyContent: 'space-between' }}>
        <ColumnWithMargins flex={1} margin={3}>
          <HeaderRow>
            <Title
              paddingRight={price ? FloatingPanel.padding.x * 1.25 : 0}
              weight="bold"
            >
              {title}
            </Title>
            {price && (
              <Price
                align="right"
                letterSpacing="roundedTight"
                weight="semibold"
              >
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
        </ColumnWithMargins>
        {asset ? (
          <ContextMenu
            css={padding(10, 0)}
            destructiveButtonIndex={
              includes(showcaseTokens, asset.uniqueId) && 0
            }
            onPressActionSheet={index => {
              if (index === 0) {
                if (includes(showcaseTokens, asset.uniqueId)) {
                  dispatch(popShowcaseToken(asset.uniqueId));
                } else {
                  dispatch(pushShowcaseToken(asset.uniqueId));
                }
                dispatch(setOpenFamilyTabs({ index: 'Showcase', state: true }));
                if (navigation) {
                  navigation.pop();
                }
                LayoutAnimation.configureNext({
                  duration: 200,
                  update: {
                    initialVelocity: 0,
                    springDamping: 1,
                    type: LayoutAnimation.Types.spring,
                  },
                });
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
};

AssetPanelHeader.propTypes = {
  price: PropTypes.string,
  priceLabel: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default AssetPanelHeader;
