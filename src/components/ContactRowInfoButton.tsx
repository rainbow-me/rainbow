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
import { ButtonPressAnimation } from './animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module './coin-row/CoinRow' was resolved to '/User... Remove this comment to see the full error message
import { CoinRowHeight } from './coin-row/CoinRow';
import { Centered } from './layout';
import { Text } from './text';
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
  ${padding(0, 0)}
  align-items: center;
  flex: 0;
  height: ${CoinRowHeight};
  justify-content: center;
  left: -5;
  position: absolute;
  top: -15;
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
  margin: 10px;
  overflow: hidden;
  width: 30px;
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

const buildBlockExplorerAction = (type: any) => {
  const blockExplorerText =
    'View on ' + startCase(ethereumUtils.getBlockExplorer(type));
  return {
    actionKey: ContactRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  };
};

const ContactRowInfoButton = ({ children, item, network, scaleTo }: any) => {
  const { setClipboard } = useClipboard();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handleCopyAddress = useCallback(
    (address: any) => {
      haptics.selection();
      setClipboard(address);
    },
    [setClipboard]
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
        title: `${item?.name}`,
      },
      (idx: any) => {
        if (idx === 0) {
          handleCopyAddress(item?.address);
        }
        if (idx === 1) {
          ethereumUtils.openAddressInBlockExplorer(item?.address, network);
        }
      }
    );
  }, [item?.type, item?.name, item?.address, handleCopyAddress, network]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
      if (actionKey === ContactRowActionsEnum.copyAddress) {
        handleCopyAddress(item?.address);
      } else if (actionKey === ContactRowActionsEnum.blockExplorer) {
        ethereumUtils.openAddressInBlockExplorer(item?.address);
      }
    },
    [item, handleCopyAddress]
  );

  const Container = children ? Centered : InfoButton;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
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
        <ButtonPressAnimation scaleTo={scaleTo}>
          {children || (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Circle>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Icon>􀅳</Icon>
            </Circle>
          )}
        </ButtonPressAnimation>
      </ContextMenuButton>
    </Container>
  );
};

export default ContactRowInfoButton;
