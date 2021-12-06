import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { magicMemo } from '../../utils';
import { Row } from '../layout';
import {
  CardSize,
  UniqueTokenCardMargin,
  UniqueTokenRowPadding,
} from './CardSize';
// @ts-expect-error ts-migrate(6142) FIXME: Module './UniqueTokenCard' was resolved to '/Users... Remove this comment to see the full error message
import UniqueTokenCard from './UniqueTokenCard';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

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

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
const UniqueTokenRow = magicMemo(({ item, external = false }: any) => {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handleItemPress = useCallback(
    (asset, lowResUrl) =>
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external,
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      {item.map((uniqueToken: any, index: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'propTypes' does not exist on type 'MemoE... Remove this comment to see the full error message
UniqueTokenRow.propTypes = {
  item: PropTypes.array,
};

// @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
UniqueTokenRow.height = CardSize + UniqueTokenCardMargin;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'cardSize' does not exist on type 'MemoEx... Remove this comment to see the full error message
UniqueTokenRow.cardSize = CardSize;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'cardMargin' does not exist on type 'Memo... Remove this comment to see the full error message
UniqueTokenRow.cardMargin = UniqueTokenCardMargin;
// @ts-expect-error ts-migrate(2339) FIXME: Property 'rowPadding' does not exist on type 'Memo... Remove this comment to see the full error message
UniqueTokenRow.rowPadding = UniqueTokenRowPadding;

export default UniqueTokenRow;
