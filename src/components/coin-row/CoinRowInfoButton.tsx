import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { useClipboard } from '@rainbow-me/hooks';
import { fonts, fontWithWidth, padding } from '@rainbow-me/styles';

import {
  abbreviations,
  ethereumUtils,
  haptics,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const InfoButton = styled(Centered)`
  ${padding(8, 0)}
  align-items: center;
  justify-content: center;
  bottom: 0;
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  right: 40;
  top: 0;
  width: 68px;
`;

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(
  ({ theme: { colors } }) => ({
    center: [0, 15],
    colors: colors.gradients.lightestGrey,
  })
)`
  border-radius: 15px;
  height: 30px;
  overflow: hidden;
  width: 30px;
  margin: 10px;
`;

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'lmedium',
  weight: 'bold',
}))`
  height: 100%;
  line-height: 29px;
  width: 100%;
  ${fontWithWidth(fonts.weight.bold)};
`;

const CoinRowActionsEnum = {
  copyAddress: 'copyAddress',
  etherscan: 'etherscan',
};

const CoinRowActions = {
  [CoinRowActionsEnum.copyAddress]: {
    actionKey: CoinRowActionsEnum.copyAddress,
    actionTitle: 'Copy Contract Address',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
  [CoinRowActionsEnum.etherscan]: {
    actionKey: CoinRowActionsEnum.etherscan,
    actionTitle: 'View on Etherscan',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari',
    },
  },
};

const androidContractActions = [
  'Copy Contract Address',
  'View on Etherscan',
  'Cancel',
];

const CoinRowInfoButton = ({ item, onCopySwapDetailsText }) => {
  const { setClipboard } = useClipboard();
  const handleCopyContractAddress = useCallback(
    address => {
      haptics.selection();
      setClipboard(address);
      onCopySwapDetailsText(address);
    },
    [onCopySwapDetailsText, setClipboard]
  );

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: `${item?.name} (${item?.symbol})`,
      },
      idx => {
        if (idx === 0) {
          handleCopyContractAddress(item?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL(item?.address);
        }
      }
    );
  }, [item, handleCopyContractAddress]);

  const menuConfig = useMemo(
    () => ({
      menuItems: [
        CoinRowActions[CoinRowActionsEnum.etherscan],
        {
          ...CoinRowActions[CoinRowActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(
            item?.address
          ),
        },
      ],
      menuTitle: `${item?.name} (${item?.symbol})`,
    }),
    [item]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === CoinRowActionsEnum.copyAddress) {
        handleCopyContractAddress(item?.address);
      } else if (actionKey === CoinRowActionsEnum.etherscan) {
        ethereumUtils.openTokenEtherscanURL(item?.address);
      }
    },
    [item, handleCopyContractAddress]
  );

  return (
    <InfoButton>
      <ContextMenuButton
        activeOpacity={0}
        menuConfig={menuConfig}
        {...(android ? { onPress: onPressAndroid } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        <ButtonPressAnimation>
          <Circle>
            <Icon>􀅳</Icon>
          </Circle>
        </ButtonPressAnimation>
      </ContextMenuButton>
    </InfoButton>
  );
};

export default CoinRowInfoButton;
