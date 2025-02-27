import React from 'react';
import { Bleed, Box, Text, TextIcon, useForegroundColor } from '@/design-system';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { FIELD_BORDER_COLOR, FIELD_BORDER_WIDTH, INPUT_HEIGHT } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export function NetworkField() {
  const navigation = useNavigation();
  const red = useForegroundColor('red');
  const { accentColors } = useTokenLauncherContext();

  const chainId = useTokenLauncherStore(state => state.chainId);
  const setChainId = useTokenLauncherStore(state => state.setChainId);
  const hasSufficientEthForTransactionGas = useTokenLauncherStore(state => state.hasSufficientEthForGas);

  const networkLabel = useBackendNetworksStore(state => state.getChainsLabel()[chainId]);
  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));
  const allowedNetworks = useBackendNetworksStore(state => state.getTokenLauncherSupportedChainIds());

  const onChainSelected = (chainId: number) => {
    setChainId(chainId);
    navigation.getParent()?.goBack();
  };

  return (
    <>
      <FieldContainer
        style={{
          height: INPUT_HEIGHT,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: hasSufficientEthForTransactionGas ? FIELD_BORDER_COLOR : red,
          gap: 8,
        }}
      >
        <Box gap={10}>
          <FieldLabel>Network</FieldLabel>
          <Text color="labelSecondary" size="13pt" weight="medium">
            {`Balance: ${nativeAssetForChain?.balance.display ?? '0.00'}`}
          </Text>
        </Box>
        <Bleed right={{ custom: 7 }}>
          <ButtonPressAnimation
            onPress={() => {
              console.log('allowedNetworks', allowedNetworks);
              navigation.navigate(Routes.NETWORK_SELECTOR, {
                selected: chainId,
                setSelected: onChainSelected,
                canEdit: false,
                canSelectAllNetworks: false,
                allowedNetworks,
              });
            }}
          >
            <Box
              backgroundColor={accentColors.opacity10}
              borderColor={{ custom: accentColors.opacity6 }}
              flexDirection="row"
              alignItems="center"
              borderWidth={FIELD_BORDER_WIDTH}
              borderRadius={16}
              paddingLeft="10px"
              paddingRight="12px"
              paddingVertical="8px"
              gap={8}
            >
              <ChainImage position="relative" chainId={chainId} size={24} />
              <Text
                color="label"
                size="17pt"
                weight="heavy"
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ maxWidth: 100, textTransform: 'capitalize' }}
              >
                {networkLabel}
              </Text>
              <TextIcon color="label" size="17pt" weight="heavy">
                {'􀆈'}
              </TextIcon>
            </Box>
          </ButtonPressAnimation>
        </Bleed>
      </FieldContainer>
      {!hasSufficientEthForTransactionGas && (
        <Box paddingHorizontal={'20px'}>
          <Text color="red" size="13pt" weight="bold">
            {'Not enough funds to launch a token'}
          </Text>
        </Box>
      )}
    </>
  );
}
