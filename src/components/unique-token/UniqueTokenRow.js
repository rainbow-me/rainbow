import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useNavigation } from '../../navigation/Navigation';
import { deviceUtils, magicMemo } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';
import { useWallets } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { padding, position } from '@rainbow-me/styles';

const UniqueTokenCardMargin = 15;
const UniqueTokenRowPadding = 19;

const CardSize =
  (deviceUtils.dimensions.width -
    UniqueTokenRowPadding * 2 -
    UniqueTokenCardMargin) /
  2;

const Container = styled(Row).attrs({ align: 'center' })`
  ${padding(0, UniqueTokenRowPadding)};
  margin-bottom: ${UniqueTokenCardMargin};
  width: 100%;
`;

const UniqueTokenCardItem = styled(UniqueTokenCard).attrs({
  ...position.sizeAsObject(CardSize),
})`
  margin-left: ${({ index }) => (index >= 1 ? UniqueTokenCardMargin : 0)};
`;

const UniqueTokenRow = magicMemo(({ item, external = false }) => {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    (aspectRatio, asset, imageColor, lowResUrl) =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        aspectRatio,
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external,
        imageColor,
        isReadOnlyWallet,
        lowResUrl,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
        type: 'unique_token',
      }),
    [external, isReadOnlyWallet, navigate]
  );

  return (
    <Container>
      {item.map((uniqueToken, index) => (
        <UniqueTokenCardItem
          disabled={false}
          index={index}
          item={uniqueToken}
          key={uniqueToken.uniqueId}
          onPress={handleItemPress}
        />
      ))}
    </Container>
  );
}, 'item.uniqueId');

UniqueTokenRow.propTypes = {
  item: PropTypes.array,
};

UniqueTokenRow.height = CardSize + UniqueTokenCardMargin;
UniqueTokenRow.cardSize = CardSize;
UniqueTokenRow.cardMargin = UniqueTokenCardMargin;
UniqueTokenRow.rowPadding = UniqueTokenRowPadding;

export default UniqueTokenRow;
