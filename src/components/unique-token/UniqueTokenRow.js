import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { useWallets } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { padding, position } from '../../styles';
import { deviceUtils, magicMemo } from '../../utils';
import { Row } from '../layout';
import UniqueTokenCard from './UniqueTokenCard';

const CardMargin = 15;
const RowPadding = 19;
const CardSize =
  (deviceUtils.dimensions.width - RowPadding * 2 - CardMargin) / 2;

const Container = styled(Row).attrs({ align: 'center' })`
  ${padding(0, RowPadding)};
  margin-bottom: ${CardMargin};
  width: 100%;
`;

const UniqueTokenCardItem = styled(UniqueTokenCard).attrs({
  ...position.sizeAsObject(CardSize),
})`
  margin-left: ${({ index }) => (index >= 1 ? CardMargin : 0)};
`;

const UniqueTokenRow = magicMemo(({ item }) => {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    asset =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        isReadOnlyWallet,
        type: 'unique_token',
      }),
    [isReadOnlyWallet, navigate]
  );

  return (
    <Container>
      {item.map((uniqueToken, index) => (
        <UniqueTokenCardItem
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

UniqueTokenRow.height = CardSize + CardMargin;
UniqueTokenRow.cardSize = CardSize;
UniqueTokenRow.cardMargin = CardMargin;
UniqueTokenRow.rowPadding = RowPadding;

export default UniqueTokenRow;
