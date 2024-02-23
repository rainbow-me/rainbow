import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useNavigation } from '../../navigation/Navigation';
import { magicMemo } from '../../utils';
import { Row } from '../layout';
import { CardSize, UniqueTokenCardMargin, UniqueTokenRowPadding } from './CardSize';
import UniqueTokenCard from './UniqueTokenCard';
import { useWallets } from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';

const Container = styled(Row).attrs({ align: 'center' })({
  ...padding.object(0, UniqueTokenRowPadding),
  marginBottom: UniqueTokenCardMargin,
  width: '100%',
});

const UniqueTokenCardItem = styled(UniqueTokenCard).attrs({
  ...position.sizeAsObject(CardSize),
})({
  marginLeft: ({ index }) => (index >= 1 ? UniqueTokenCardMargin : 0),
});

const UniqueTokenRow = magicMemo(({ item, external = false }) => {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    asset =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external,
        isReadOnlyWallet,
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
        <UniqueTokenCardItem disabled={false} index={index} item={uniqueToken} key={uniqueToken.uniqueId} onPress={handleItemPress} />
      ))}
    </Container>
  );
}, 'uniqueId');

UniqueTokenRow.propTypes = {
  item: PropTypes.array,
};

UniqueTokenRow.height = CardSize + UniqueTokenCardMargin;
UniqueTokenRow.cardSize = CardSize;
UniqueTokenRow.cardMargin = UniqueTokenCardMargin;
UniqueTokenRow.rowPadding = UniqueTokenRowPadding;

export default UniqueTokenRow;
