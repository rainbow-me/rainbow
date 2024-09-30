import lang from 'i18n-js';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '@/components/Divider';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { ContextMenuButton } from '@/components/context-menu';
import { Column, Row } from '../layout';
import { Text } from '../text';
import { padding, position } from '@/styles';
import { showActionSheetWithOptions } from '@/utils';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';
import { chainsLabel, chainsName, defaultChains, supportedSwapChainIds } from '@/chains';
import { isL2Chain } from '@/handlers/web3';

const networkMenuItems = supportedSwapChainIds
  .map(chainId => defaultChains[chainId])
  .map(chain => ({
    actionKey: chain.id,
    actionTitle: chainsLabel[chain.id],
    icon: {
      iconType: 'ASSET',
      iconValue: `${isL2Chain({ chainId: chain.id }) ? `${chain.name}BadgeNoShadow` : 'ethereumBadge'}`,
    },
  }));

const androidNetworkMenuItems = supportedSwapChainIds.map(chainId => defaultChains[chainId].id);

const NetworkSwitcherv1 = ({
  colors,
  hideDivider,
  marginVertical = 12,
  marginHorizontal = 19,
  currentChainId,
  setCurrentChainId,
  testID,
  prominent,
}) => {
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
    ({ nativeEvent: { actionKey } }) => {
      setCurrentChainId(actionKey);
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
      idx => {
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
