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
  marginLeft: ({ index }: { index: number }) => (index >= 1 ? UniqueTokenCardMargin : 0),
});

interface UniqueToken {
  uniqueId: string;
  [key: string]: any;
}

interface UniqueTokenRowProps {
  item: UniqueToken[];
  external?: boolean;
}

interface UniqueTokenRowComponent extends React.FC<UniqueTokenRowProps> {
  height: number;
  cardSize: number;
  cardMargin: number;
  rowPadding: number;
}

const UniqueTokenRow = magicMemo(({ item, external = false }: UniqueTokenRowProps) => {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    (asset: UniqueToken) =>
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
}, 'uniqueId') as unknown as UniqueTokenRowComponent;

UniqueTokenRow.height = CardSize + UniqueTokenCardMargin;
UniqueTokenRow.cardSize = CardSize;
UniqueTokenRow.cardMargin = UniqueTokenCardMargin;
UniqueTokenRow.rowPadding = UniqueTokenRowPadding;

export default UniqueTokenRow;
