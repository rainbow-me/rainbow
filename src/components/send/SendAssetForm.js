import PropTypes from 'prop-types';
import React, { createElement, Fragment } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import { pure } from 'recompose';
import styled from 'styled-components/primitives';
import AssetTypes from '../../helpers/assetTypes';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { colors, padding, position } from '../../styles';
import { deviceUtils, ethereumUtils, safeAreaInsetValues } from '../../utils';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import SendSavingsCoinRow from '../coin-row/SendSavingsCoinRow';
import { Icon } from '../icons';
import { Column } from '../layout';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${colors.white};
  flex: 1;
  overflow: hidden;
`;

const nftPaddingBottom = safeAreaInsetValues.bottom;
const tokenPaddingBottom = sheetVerticalOffset + 19;

const TransactionContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${({ isNft }) =>
    padding(22, isNft ? 0 : 15, isNft ? nftPaddingBottom : tokenPaddingBottom)};
  background-color: ${colors.lighterGrey};
  flex: 1;
  width: 100%;
`;

const SendAssetForm = ({
  allAssets,
  assetAmount,
  buttonRenderer,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onResetAssetSelection,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) => {
  const selectedAsset = ethereumUtils.getAsset(allAssets, selected.address);

  const isNft = selected.type === AssetTypes.nft;
  const isSavings = selected.type === AssetTypes.cToken;

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
        shouldRasterizeIOS
        width={deviceUtils.dimensions.width}
      >
        {createElement(
          isNft
            ? CollectiblesSendRow
            : isSavings
            ? SendSavingsCoinRow
            : SendCoinRow,
          {
            children: <Icon name="doubleCaret" />,
            item: isNft || isSavings ? selected : selectedAsset,
            onPress: onResetAssetSelection,
            selected: true,
          }
        )}
      </ShadowStack>
      <TransactionContainer isNft={isNft}>
        {isNft ? (
          <SendAssetFormCollectible
            {...selected}
            buttonRenderer={buttonRenderer}
            txSpeedRenderer={txSpeedRenderer}
          />
        ) : (
          <Fragment>
            <SendAssetFormToken
              {...props}
              assetAmount={assetAmount}
              buttonRenderer={buttonRenderer}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              onChangeAssetAmount={onChangeAssetAmount}
              onChangeNativeAmount={onChangeNativeAmount}
              selected={selected}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={txSpeedRenderer}
            />
          </Fragment>
        )}
      </TransactionContainer>
    </Container>
  );
};

SendAssetForm.propTypes = {
  allAssets: PropTypes.array,
  assetAmount: PropTypes.string,
  buttonRenderer: PropTypes.node,
  nativeAmount: PropTypes.string,
  nativeCurrency: PropTypes.string,
  onChangeAssetAmount: PropTypes.func,
  onChangeNativeAmount: PropTypes.func,
  onResetAssetSelection: PropTypes.func,
  selected: PropTypes.object,
  sendMaxBalance: PropTypes.func,
  txSpeedRenderer: PropTypes.node,
};

export default pure(SendAssetForm);
