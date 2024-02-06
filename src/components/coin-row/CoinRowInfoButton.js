import lang from 'i18n-js';
import { startCase } from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { Text } from '../text';
import { CoinRowHeight } from './CoinRow';
import { useClipboard } from '@/hooks';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, padding } from '@/styles';
import { abbreviations, ethereumUtils, haptics, showActionSheetWithOptions } from '@/utils';

const InfoButton = styled(Centered)({
  ...padding.object(8, 0),
  alignItems: 'center',
  bottom: 0,
  flex: 0,
  height: CoinRowHeight,
  justifyContent: 'center',
  position: 'absolute',
  right: ({ showFavoriteButton }) => (showFavoriteButton ? 40 : 0),
  top: 0,
  width: 68,
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
  ...fontWithWidth(fonts.weight.bold),
  height: '100%',
  lineHeight: 30,
  width: '100%',
});

const CoinRowActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
};

const CoinRowActions = {
  [CoinRowActionsEnum.copyAddress]: {
    actionKey: CoinRowActionsEnum.copyAddress,
    actionTitle: lang.t('wallet.action.copy_contract_address'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
};

const buildBlockExplorerAction = type => {
  const blockExplorerText = lang.t('exchange.coin_row.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(type)),
  });
  return {
    actionKey: CoinRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  };
};

const CoinRowInfoButton = ({ item, onCopySwapDetailsText, showFavoriteButton }) => {
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
    const blockExplorerText = `View on ${startCase(ethereumUtils.getBlockExplorer(item?.network))}`;
    const androidContractActions = [lang.t('wallet.action.copy_contract_address'), blockExplorerText, lang.t('button.cancel')];

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
          ethereumUtils.openTokenEtherscanURL(item?.address, item?.network);
        }
      }
    );
  }, [item, handleCopyContractAddress]);

  const menuConfig = useMemo(() => {
    const blockExplorerAction = buildBlockExplorerAction(item?.network);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...CoinRowActions[CoinRowActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(item?.address),
        },
      ],
      menuTitle: `${item?.name} (${item?.symbol})`,
    };
  }, [item?.address, item?.name, item?.network, item?.symbol]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === CoinRowActionsEnum.copyAddress) {
        handleCopyContractAddress(item?.address);
      } else if (actionKey === CoinRowActionsEnum.blockExplorer) {
        ethereumUtils.openTokenEtherscanURL(item?.address, item?.network);
      }
    },
    [item, handleCopyContractAddress]
  );
  return (
    <InfoButton showFavoriteButton={showFavoriteButton}>
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
