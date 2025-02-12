import React from 'react';
import { Bleed, Box, Text, TextIcon } from '@/design-system';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useTheme } from '@/theme';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { FIELD_BORDER_WIDTH, INPUT_HEIGHT } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export function NetworkField() {
  const { accentColors } = useTokenLauncherContext();

  const chainId = useTokenLauncherStore(state => state.chainId);
  const setChainId = useTokenLauncherStore(state => state.setChainId);
  const networkLabel = useBackendNetworksStore.getState().getChainsLabel()[chainId];

  const navigation = useNavigation();

  const onChainSelected = (chainId: number) => {
    setChainId(chainId);
    navigation.getParent()?.goBack();
  };

  const nativeAssetForChain = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));

  return (
    <FieldContainer style={{ height: INPUT_HEIGHT, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box gap={10}>
        <FieldLabel>Network</FieldLabel>
        <Text color="labelSecondary" size="13pt" weight="medium">
          {`Balance: ${nativeAssetForChain?.balance.display ?? '0'}`}
        </Text>
      </Box>
      <ButtonPressAnimation
        onPress={() => {
          navigation.navigate(Routes.NETWORK_SELECTOR, {
            selected: chainId,
            setSelected: onChainSelected,
            canEdit: false,
            canSelectAllNetworks: false,
          });
        }}
      >
        <Bleed right={{ custom: 7 }}>
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
            <Text color="label" size="17pt" weight="heavy" style={{ textTransform: 'capitalize' }}>
              {networkLabel}
            </Text>
            <TextIcon color="label" size="17pt" weight="heavy">
              {'􀆈'}
            </TextIcon>
          </Box>
        </Bleed>
      </ButtonPressAnimation>
    </FieldContainer>
  );
}
