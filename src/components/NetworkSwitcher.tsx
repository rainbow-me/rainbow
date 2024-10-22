import lang from 'i18n-js';
import React, { useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '@/components/Divider';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { ContextMenuButton } from '@/components/context-menu';
import { Column, Row } from '@/components/layout';
import { Text } from '@/components/text';
import { Colors, padding, position } from '@/styles';
import { showActionSheetWithOptions } from '@/utils';
import { EthCoinIcon } from '@/components/coin-icon/EthCoinIcon';
import { chainsLabel, chainsName, defaultChains, supportedSwapChainIds } from '@/chains';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { ChainId } from '@/chains/types';

const networkMenuItems = supportedSwapChainIds
  .map(chainId => defaultChains[chainId])
  .map(chain => ({
    actionKey: `${chain.id}`,
    actionTitle: chainsLabel[chain.id],
    icon: {
      iconType: 'ASSET',
      iconValue: `${chainsName[chain.id]}Badge${chain.id === ChainId.mainnet ? '' : 'NoShadow'}`,
    },
  }));

const androidNetworkMenuItems = supportedSwapChainIds.map(chainId => defaultChains[chainId].id);

type NetworkSwitcherProps = {
  colors: Colors;
  hideDivider: boolean;
  marginVertical?: number;
  marginHorizontal?: number;
  currentChainId: number;
  setCurrentChainId: (chainId: ChainId) => void;
  testID: string;
  prominent: boolean;
};

const NetworkSwitcherv1 = ({
  colors,
  hideDivider,
  marginVertical = 12,
  marginHorizontal = 19,
  currentChainId,
  setCurrentChainId,
  testID,
  prominent,
}: NetworkSwitcherProps) => {
  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: OnPressMenuItemEventObject) => {
      setCurrentChainId(Number(actionKey));
    },
    [setCurrentChainId]
  );
  const onPressAndroid = useCallback(() => {
    const networkActions = androidNetworkMenuItems;
    showActionSheetWithOptions(
      {
        options: networkActions,
        showSeparators: true,
      },
      (idx: number) => {
        if (idx !== undefined) {
          setCurrentChainId(networkActions[idx]);
        }
      }
    );
  }, [setCurrentChainId]);

  return (
    <>
      <ContextMenuButton
        menuItems={networkMenuItems}
        menuTitle=""
        onPressAndroid={onPressAndroid}
        onPressMenuItem={handleOnPressMenuItem}
        testID={`${testID}-${currentChainId}`}
      >
        <Row
          borderRadius={16}
          marginHorizontal={marginHorizontal}
          marginVertical={marginVertical}
          style={padding.object(android ? 6 : 10, 10, android ? 6 : 10, 10)}
        >
          {/* @ts-expect-error - borderRadius is not a valid prop for RadialGradient */}
          <RadialGradient {...radialGradientProps} borderRadius={16} radius={600} />
          <Column justify="center">
            {currentChainId !== 1 ? <ChainBadge chainId={currentChainId} position="relative" size="small" /> : <EthCoinIcon size={20} />}
          </Column>
          <Column flex={1} justify="center" marginHorizontal={8}>
            <Text
              color={prominent ? colors.alpha(colors.blueGreyDark, 0.8) : colors.alpha(colors.blueGreyDark, 0.6)}
              numberOfLines={2}
              size="smedium"
              weight={prominent ? 'heavy' : 'bold'}
            >
              {lang.t('expanded_state.swap.network_switcher', {
                network: chainsName[currentChainId],
              })}
            </Text>
          </Column>
          <Column align="end" justify="center">
            <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.3)} size="smedium" weight="heavy">
              􀆈
            </Text>
          </Column>
        </Row>
      </ContextMenuButton>
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} />}
    </>
  );
};

export default NetworkSwitcherv1;
