import { startCase } from 'lodash';
import React from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import { CoinRowHeight } from './CoinRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useClipboard } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, padding } from '@rainbow-me/styles';
import {
  abbreviations,
  ethereumUtils,
  haptics,
  showActionSheetWithOptions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
  line-height: 30px;
  width: 100%;
  ${fontWithWidth(fonts.weight.bold)};
`;

const CoinRowActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
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
};

const buildBlockExplorerAction = (type: any) => {
  const blockExplorerText =
    'View on ' + startCase(ethereumUtils.getBlockExplorer(type));
  return {
    actionKey: CoinRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  };
};

const CoinRowInfoButton = ({ item, onCopySwapDetailsText }: any) => {
  const { setClipboard } = useClipboard();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handleCopyContractAddress = useCallback(
    (address: any) => {
      haptics.selection();
      setClipboard(address);
      onCopySwapDetailsText(address);
    },
    [onCopySwapDetailsText, setClipboard]
  );

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
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
        title: `${item?.name} (${item?.symbol})`,
      },
      (idx: any) => {
        if (idx === 0) {
          handleCopyContractAddress(item?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL(item?.address, item?.type);
        }
      }
    );
  }, [item, handleCopyContractAddress]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const menuConfig = useMemo(() => {
    const blockExplorerAction = buildBlockExplorerAction(item?.type);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...CoinRowActions[CoinRowActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(
            item?.address
          ),
        },
      ],
      menuTitle: `${item?.name} (${item?.symbol})`,
    };
  }, [item?.address, item?.name, item?.symbol, item?.type]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
      if (actionKey === CoinRowActionsEnum.copyAddress) {
        handleCopyContractAddress(item?.address);
      } else if (actionKey === CoinRowActionsEnum.blockExplorer) {
        ethereumUtils.openTokenEtherscanURL(item?.address, item?.type);
      }
    },
    [item, handleCopyContractAddress]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <InfoButton>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ContextMenuButton
        activeOpacity={0}
        menuConfig={menuConfig}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {...(android ? { onPress: onPressAndroid } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Circle>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Icon>􀅳</Icon>
          </Circle>
        </ButtonPressAnimation>
      </ContextMenuButton>
    </InfoButton>
  );
};

export default CoinRowInfoButton;
