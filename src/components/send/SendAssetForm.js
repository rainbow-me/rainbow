import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { pure } from 'recompose';
import styled from 'styled-components/primitives';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import transitions from '../../navigation/transitions';
import { colors, padding, position } from '../../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../../utils';
import { SendCoinRow } from '../coin-row';
import { Icon } from '../icons';
import { Column, ColumnWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${colors.white};
  flex: 1;
  overflow: hidden;
`;

const nftPaddingBottom = safeAreaInsetValues.bottom + 19;
const tokenPaddingBottom = transitions.sheetVerticalOffset + 19;

const TransactionContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${({ isNft }) => padding(22, 15, isNft ? nftPaddingBottom : tokenPaddingBottom)};
  background-color: ${colors.lightGrey};
  flex: 1;
  width: 100%;
`;

const SendAssetForm = ({
  allAssets,
  buttonRenderer,
  onResetAssetSelection,
  selected,
  txSpeedRenderer,
  ...props
}) => {
  const selectedAsset = ethereumUtils.getAsset(allAssets, selected.address);

  return (
    <Container>
      <ShadowStack
        borderRadius={0}
        flex={0}
        height={SendCoinRow.selectedHeight}
        shadows={[
          [0, 1, 0, colors.dark, 0.01],
          [0, 4, 12, colors.dark, 0.04],
          [0, 8, 23, colors.dark, 0.05],
        ]}
        shouldRasterizeIOS={true}
        width={deviceUtils.dimensions.width}
      >
        {createElement(selected.isNft ? CollectiblesSendRow : SendCoinRow, {
          children: <Icon name="doubleCaret" />,
          item: selected.isNft ? selected : selectedAsset,
          onPress: onResetAssetSelection,
          selected: true,
        })}
      </ShadowStack>
      <TransactionContainer isNft={selected.isNft}>
        {selected.isNft
          ? <SendAssetFormCollectible {...selected} />
          : <SendAssetFormToken {...props} selected={selected} />
        }
        <ColumnWithMargins
          flex={0}
          margin={(deviceUtils.dimensions.height < 812) ? 15.5 : 31}
          style={{ zIndex: 3 }}
          width="100%"
        >
          {buttonRenderer}
          {txSpeedRenderer}
        </ColumnWithMargins>
      </TransactionContainer>
    </Container>
  );
};

SendAssetForm.propTypes = {
  allAssets: PropTypes.array,
  assetAmount: PropTypes.string,
  buttonRenderer: PropTypes.node,
  onResetAssetSelection: PropTypes.func,
  selected: PropTypes.object,
  txSpeedRenderer: PropTypes.node,
};

export default pure(SendAssetForm);
