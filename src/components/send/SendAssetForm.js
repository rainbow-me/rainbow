import React, { Fragment } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import AssetTypes from '../../helpers/assetTypes';
import { useAsset, useDimensions } from '../../hooks';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import SendSavingsCoinRow from '../coin-row/SendSavingsCoinRow';
import { Icon } from '../icons';
import { Column } from '../layout';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';
import { colors, padding, position } from '@rainbow-me/styles';

const AssetRowShadow = [
  [0, 1, 0, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${colors.white};
  flex: 1;
  overflow: hidden;
`;

const FormContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${({ isNft }) => (isNft ? padding(22, 0, 0) : padding(19, 15))};
  background-color: ${colors.lighterGrey};
  flex: 1;
  width: 100%;
`;

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${colors.lighterGrey};
`;

export default function SendAssetForm({
  assetAmount,
  buttonRenderer,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onFocus,
  onResetAssetSelection,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) {
  const { width: deviceWidth } = useDimensions();

  const selectedAsset = useAsset(selected);

  const isNft = selectedAsset.type === AssetTypes.nft;
  const isSavings = selectedAsset.type === AssetTypes.cToken;

  const AssetRowElement = isNft
    ? CollectiblesSendRow
    : isSavings
    ? SendSavingsCoinRow
    : SendCoinRow;

  return (
    <Container>
      <ShadowStack
        borderRadius={0}
        height={SendCoinRow.selectedHeight}
        shadows={AssetRowShadow}
        width={deviceWidth}
      >
        <AssetRowElement
          item={selectedAsset}
          onPress={onResetAssetSelection}
          selected
        >
          <Icon name="doubleCaret" />
        </AssetRowElement>
      </ShadowStack>
      <FormContainer isNft={isNft}>
        {isNft ? (
          <SendAssetFormCollectible
            asset={selectedAsset}
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
              onFocus={onFocus}
              selected={selectedAsset}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={txSpeedRenderer}
            />
            <KeyboardSizeView isOpen />
          </Fragment>
        )}
      </FormContainer>
    </Container>
  );
}
