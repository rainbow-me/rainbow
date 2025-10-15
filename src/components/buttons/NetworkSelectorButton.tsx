import React, { useCallback, useMemo } from 'react';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Bleed, Inline, Text, TextProps } from '@/design-system';
import i18n from '@/languages';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { RouteProp } from '@react-navigation/native';

interface DefaultButtonOptions {
  iconColor?: TextProps['color'];
  iconSize?: TextProps['size'];
  iconWeight?: TextProps['weight'];
  textColor?: TextProps['color'];
  textSize?: TextProps['size'];
  textWeight?: TextProps['weight'];
}

type NetworkSelectorProps = Omit<RouteProp<RootStackParamList, 'NetworkSelector'>['params'], 'selected' | 'setSelected'>;

type NetworkSelectorButtonProps = {
  bleed?: boolean;
  disabled?: boolean;
  defaultButtonOptions?: DefaultButtonOptions;
  onSelectChain: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
} & NetworkSelectorProps;

export const NetworkSelectorButton = ({
  bleed = true,
  disabled,
  defaultButtonOptions = {},
  onSelectChain,
  selectedChainId,
  actionButton = {
    label: i18n.exchange.all_networks(),
    color: 'labelSecondary',
    weight: 'bold',
  },
  ...networkSelectorProps
}: NetworkSelectorButtonProps) => {
  const { navigate } = useNavigation();
  const {
    iconColor = 'labelSecondary',
    iconSize = 'icon 13px',
    iconWeight = 'bold',
    textColor = 'label',
    textSize = '15pt',
    textWeight = 'heavy',
  } = defaultButtonOptions;

  const handleSelectChain = useCallback(
    (chainId: ChainId | undefined) => {
      onSelectChain(chainId);
    },
    [onSelectChain]
  );

  const navigateToNetworkSelector = useCallback(() => {
    navigate(Routes.NETWORK_SELECTOR, {
      ...networkSelectorProps,
      actionButton,
      selected: selectedChainId,
      setSelected: handleSelectChain,
    });
  }, [handleSelectChain, navigate, networkSelectorProps, selectedChainId]);

  const displayName = useMemo(() => {
    if (!selectedChainId) return actionButton.label;
    return useBackendNetworksStore.getState().getChainsLabel()[selectedChainId];
  }, [actionButton.label, selectedChainId]);

  return (
    <Bleed horizontal={bleed ? '12px' : undefined}>
      <ButtonPressAnimation disabled={disabled} onPress={navigateToNetworkSelector} padding="12px" testID="network-selector-button">
        <Inline alignVertical="center" space="6px" wrap={false}>
          {actionButton.icon && !selectedChainId && (
            <Text align="center" color={actionButton.color || iconColor} size={iconSize} weight={actionButton.weight || iconWeight}>
              {actionButton.icon}
            </Text>
          )}
          {selectedChainId && (
            <Bleed vertical="4px">
              <ChainImage chainId={selectedChainId} position="relative" size={16} />
            </Bleed>
          )}
          <Text color={textColor} numberOfLines={1} size={textSize} weight={textWeight}>
            {displayName}
          </Text>
          <Text align="center" color={iconColor} size={iconSize} weight={iconWeight}>
            􀆏
          </Text>
        </Inline>
      </ButtonPressAnimation>
    </Bleed>
  );
};
