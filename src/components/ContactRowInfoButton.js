import lang from 'i18n-js';
import { startCase } from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from './animations';
import { CoinRowHeight } from './coin-row/CoinRow';
import { Centered } from './layout';
import { Text } from './text';
import { useClipboard } from '@/hooks';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, padding } from '@/styles';

import { abbreviations, ethereumUtils, haptics, showActionSheetWithOptions } from '@/utils';

const InfoButton = styled(Centered)({
  alignItems: 'center',
  flex: 0,
  height: CoinRowHeight,
  justifyContent: 'center',
  left: -5,
  position: 'absolute',
  top: -15,
  width: 68,
  ...padding.object(0, 0),
});

const Circle = styled(IS_TESTING === 'true' ? View : RadialGradient).attrs(({ theme: { colors } }) => ({
  center: [0, 15],
  colors: colors.gradients.lightestGrey,
}))({
  borderRadius: 15,
  height: 30,
  margin: 10,
  overflow: 'hidden',
  width: 30,
});

const Icon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.3),
  letterSpacing: 'zero',
  size: 'lmedium',
  weight: 'bold',
}))({
  height: '100%',
  lineHeight: 29,
  width: '100%',
  ...fontWithWidth(fonts.weight.bold),
});

const ContactRowActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
};

const ContactRowActions = {
  [ContactRowActionsEnum.copyAddress]: {
    actionKey: ContactRowActionsEnum.copyAddress,
    actionTitle: lang.t('wallet.copy_address'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
};

const buildBlockExplorerAction = type => {
  const blockExplorerText = lang.t('wallet.action.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(type)),
  });

  return {
    actionKey: ContactRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  };
};

const ContactRowInfoButton = ({ children, item, network, scaleTo }) => {
  const { setClipboard } = useClipboard();
  const handleCopyAddress = useCallback(
    address => {
      haptics.selection();
      setClipboard(address);
    },
    [setClipboard]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText = `View on ${startCase(ethereumUtils.getBlockExplorer(item?.network))}`;
    const androidContractActions = [lang.t('wallet.action.copy_contract_address'), blockExplorerText, lang.t('button.cancel')];
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
  }, [item?.network, item?.name, item?.address, handleCopyAddress, network]);

  const menuConfig = useMemo(() => {
    const blockExplorerAction = buildBlockExplorerAction(item?.network);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...ContactRowActions[ContactRowActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(item?.address),
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

  const Container = children ? Centered : InfoButton;

  return (
    <Container>
      <ContextMenuButton
        activeOpacity={0}
        menuConfig={menuConfig}
        {...(android ? { onPress: onPressAndroid } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        <ButtonPressAnimation scaleTo={scaleTo}>
          {children || (
            <Circle>
              <Icon>􀅳</Icon>
            </Circle>
          )}
        </ButtonPressAnimation>
      </ContextMenuButton>
    </Container>
  );
};

export default ContactRowInfoButton;
