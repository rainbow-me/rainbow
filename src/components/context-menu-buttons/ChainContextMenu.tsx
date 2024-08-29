import React, { useCallback, useMemo } from 'react';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ContextMenuButton } from '@/components/context-menu';
import { Bleed, Box, Inline, Text, TextProps } from '@/design-system';
import * as i18n from '@/languages';
import { ChainId, ChainNameDisplay } from '@/networks/types';
import { showActionSheetWithOptions } from '@/utils';
import { userAssetsStore } from '@/state/assets/userAssets';
import { chainNameForChainIdWithMainnetSubstitution } from '@/__swaps__/utils/chains';

interface DefaultButtonOptions {
  iconColor?: TextProps['color'];
  iconSize?: TextProps['size'];
  iconWeight?: TextProps['weight'];
  textColor?: TextProps['color'];
  textSize?: TextProps['size'];
  textWeight?: TextProps['weight'];
}

type ChainContextMenuProps = {
  allNetworksIcon?: { color?: TextProps['color']; icon: string; name: string; weight?: TextProps['weight'] };
  allNetworksText?: string;
  chainsToDisplay?: ChainId[];
  customButtonComponent?: (props: { onPress: () => void; selectedChainId: ChainId | undefined }) => React.ReactNode;
  defaultButtonOptions?: DefaultButtonOptions;
  excludeChainsWithNoBalance?: boolean;
  onSelectChain: (chainId: ChainId | undefined) => void;
  selectedChainId: ChainId | undefined;
  showAllNetworksOption?: boolean;
};

export const ChainContextMenu = ({
  allNetworksIcon,
  allNetworksText = i18n.t(i18n.l.exchange.all_networks),
  chainsToDisplay,
  customButtonComponent: CustomButtonComponent,
  defaultButtonOptions = {},
  excludeChainsWithNoBalance,
  onSelectChain,
  selectedChainId,
  showAllNetworksOption = true,
}: ChainContextMenuProps) => {
  const {
    iconColor = 'labelSecondary',
    iconSize = 'icon 13px',
    iconWeight = 'bold',
    textColor = 'label',
    textSize = '15pt',
    textWeight = 'heavy',
  } = defaultButtonOptions;

  const balanceSortedChains = userAssetsStore(state =>
    // eslint-disable-next-line no-nested-ternary
    chainsToDisplay ? chainsToDisplay : excludeChainsWithNoBalance ? state.getChainsWithBalance() : state.getBalanceSortedChainList()
  );

  const menuConfig = useMemo(() => {
    const chainItems = balanceSortedChains.map(chainId => {
      const networkName = chainNameForChainIdWithMainnetSubstitution(chainId);
      const displayName = ChainNameDisplay[chainId];

      return {
        actionKey: `${chainId}`,
        actionTitle: displayName,
        icon: {
          iconType: 'ASSET',
          iconValue: `${networkName}Badge${chainId === ChainId.mainnet ? '' : 'NoShadow'}`,
        },
      };
    });

    return showAllNetworksOption
      ? [
          {
            actionKey: 'all',
            actionTitle: allNetworksText,
            ...(allNetworksIcon
              ? {
                  icon: {
                    iconType: 'SYSTEM',
                    iconValue: allNetworksIcon.name,
                  },
                }
              : {}),
          },
          ...chainItems,
        ]
      : chainItems;
  }, [allNetworksIcon, allNetworksText, balanceSortedChains, showAllNetworksOption]);

  const handleSelectChain = useCallback(
    (actionKey: string) => {
      const chainId = actionKey === 'all' ? undefined : (Number(actionKey) as ChainId);
      onSelectChain(chainId);
    },
    [onSelectChain]
  );

  const onShowActionSheet = useCallback(() => {
    const options = menuConfig.map(item => item.actionTitle);

    showActionSheetWithOptions(
      {
        options,
        showSeparators: true,
      },
      (selectedIndex: number | undefined) => {
        if (selectedIndex !== undefined) {
          handleSelectChain(menuConfig[selectedIndex].actionKey);
        }
      }
    );
  }, [handleSelectChain, menuConfig]);

  const displayName = useMemo(() => {
    if (!selectedChainId) return allNetworksText;
    const name = ChainNameDisplay[selectedChainId];
    return name.endsWith(' Chain') ? name.slice(0, -6) : name;
  }, [allNetworksText, selectedChainId]);

  return (
    <Bleed space="12px">
      <ContextMenuButton
        menuItems={menuConfig}
        menuTitle=""
        onPressMenuItem={useCallback(
          ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => handleSelectChain(actionKey),
          [handleSelectChain]
        )}
        onPressAndroid={onShowActionSheet}
        testID="chain-context-menu"
      >
        <Box padding="12px">
          {CustomButtonComponent ? (
            <CustomButtonComponent onPress={onShowActionSheet} selectedChainId={selectedChainId} />
          ) : (
            <Inline alignVertical="center" space="6px" wrap={false}>
              {allNetworksIcon && !selectedChainId && (
                <Text
                  align="center"
                  color={allNetworksIcon.color || iconColor}
                  size={iconSize}
                  weight={allNetworksIcon.weight || iconWeight}
                >
                  {allNetworksIcon.icon}
                </Text>
              )}
              {selectedChainId && (
                <Bleed vertical="4px">
                  <ChainImage chainId={selectedChainId} size={16} />
                </Bleed>
              )}
              <Text color={textColor} numberOfLines={1} size={textSize} weight={textWeight}>
                {displayName}
              </Text>
              <Text align="center" color={iconColor} size={iconSize} weight={iconWeight}>
                􀆏
              </Text>
            </Inline>
          )}
        </Box>
      </ContextMenuButton>
    </Bleed>
  );
};
