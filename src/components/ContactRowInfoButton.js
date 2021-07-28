import { startCase } from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from './animations';
import { CoinRowHeight } from './coin-row/CoinRow';
import { Centered } from './layout';
import { Text } from './text';
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
  flex: 0;
  height: ${CoinRowHeight};
  position: absolute;
  width: 68px;
  top: -15;
  left: -5;
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

const ContactRowActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
};

const ContactRowActions = {
  [ContactRowActionsEnum.copyAddress]: {
    actionKey: ContactRowActionsEnum.copyAddress,
    actionTitle: 'Copy Address',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
};

const buildBlockExplorerAction = type => {
  const blockExplorerText =
    'View on ' + startCase(ethereumUtils.getBlockExplorer(type));
  return {
    actionKey: ContactRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari',
    },
  };
};

const ContactRowInfoButton = ({ item, network }) => {
  const { setClipboard } = useClipboard();
  const handleCopyAddress = useCallback(
    address => {
      haptics.selection();
      setClipboard(address);
    },
    [setClipboard]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText = `View on ' ${startCase(
      ethereumUtils.getBlockExplorer(item?.type)
    )}`;
    const androidContractActions = [
      'Copy Contract Address',
      blockExplorerText,
      'Cancel',
    ];
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: `${item?.name}`,
      },
      idx => {
        if (idx === 0) {
          handleCopyAddress(item?.address);
        }
        if (idx === 1) {
          ethereumUtils.openAddressInBlockExplorer(item?.address, network);
        }
      }
    );
  }, [item?.type, item?.name, item?.address, handleCopyAddress, network]);

  const menuConfig = useMemo(() => {
    const blockExplorerAction = buildBlockExplorerAction(item?.type);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...ContactRowActions[ContactRowActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(
            item?.address
          ),
        },
      ],
      menuTitle: `${item?.name}`,
    };
  }, [item]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ContactRowActionsEnum.copyAddress) {
        handleCopyAddress(item?.address);
      } else if (actionKey === ContactRowActionsEnum.blockExplorer) {
        ethereumUtils.openAddressInBlockExplorer(item?.address);
      }
    },
    [item, handleCopyAddress]
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

export default ContactRowInfoButton;
