import React from 'react';
import { Keyboard } from 'react-native';
import { RouteProp } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import colors from '@/theme/currentColors';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { getPositionSheetHeight } from '@/screens/positions/PositionSheet';

import { Icon } from '@/components/icons';
import { SheetHandleFixedToTopHeight } from '@/components/sheet';
import { Text } from '@/components/text';

import { getENSAdditionalRecordsSheetHeight } from '@/screens/ENSAdditionalRecordsSheet';
import { ENSConfirmRegisterSheetHeight } from '@/screens/ENSConfirmRegisterSheet';
import { ExplainSheetHeight, getExplainSheetConfig } from '@/screens/ExplainSheet';
import { ExternalLinkWarningSheetHeight } from '@/screens/ExternalLinkWarningSheet';
import { getSheetHeight as getSendConfirmationSheetHeight } from '@/screens/SendConfirmationSheet';

import { onWillPop } from '@/navigation/Navigation';
import { HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT } from '@/navigation/HardwareWalletTxNavigator';
import { StackNavigationOptions } from '@react-navigation/stack';
import { ExplainSheetRouteParams, ExplainSheetType, PartialNavigatorConfigOptions, RootStackParamList } from '@/navigation/types';
import { BottomSheetNavigationOptions } from '@/navigation/bottom-sheet/types';
import { Box } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import Routes from './routesNames';

export const sharedCoolModalTopOffset = safeAreaInsetValues.top;

export type CoolModalConfigOptions = StackNavigationOptions & {
  allowsDragToDismiss?: boolean;
  allowsTapToDismiss?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  blocksBackgroundTouches?: boolean;
  cornerRadius?: number;
  customStack?: boolean;
  disableShortFormAfterTransitionToLongForm?: boolean;
  headerHeight?: number;
  ignoreBottomOffset?: boolean;
  isShortFormEnabled?: boolean;
  longFormHeight?: number;
  onAppear?: () => void;
  onWillDismiss?: () => void;
  scrollEnabled?: boolean;
  single?: boolean;
  springDamping?: number;
  startFromShortForm?: boolean;
  topOffset?: number;
  transitionDuration?: number;
};

export type CoolModalConfigParams = {
  type?: ExplainSheetType;
  backgroundColor?: string;
  backgroundOpacity?: number;
  blocksBackgroundTouches?: boolean;
  cornerRadius?: string | number;
  disableShortFormAfterTransitionToLongForm?: boolean;
  gestureEnabled?: boolean;
  headerHeight?: number;
  isShortFormEnabled?: boolean;
  longFormHeight?: number;
  height?: number;
  onAppear?: () => void;
  scrollEnabled?: boolean;
  single?: boolean;
  springDamping?: number;
  startFromShortForm?: boolean;
  topOffset?: number;
  transitionDuration?: number;
};

const buildCoolModalConfig = (params: CoolModalConfigParams): CoolModalConfigOptions => ({
  allowsDragToDismiss: true,
  allowsTapToDismiss: true,
  backgroundColor: params.backgroundColor || colors.themedColors?.shadowBlack,
  backgroundOpacity: params.backgroundOpacity || 0.7,
  blocksBackgroundTouches: true,
  cornerRadius:
    params.cornerRadius === 'device'
      ? android
        ? 30
        : 0.666 // 0.666 gets the screen corner radius internally
      : params.cornerRadius === 0
        ? 0
        : typeof params.cornerRadius === 'number'
          ? params.cornerRadius
          : 39,
  customStack: true,
  disableShortFormAfterTransitionToLongForm: params.disableShortFormAfterTransitionToLongForm,
  gestureEnabled: true,
  headerHeight: params.headerHeight || 25,
  ignoreBottomOffset: true,
  isShortFormEnabled: params.isShortFormEnabled,
  longFormHeight: params.longFormHeight,
  onAppear: params.onAppear || undefined,
  scrollEnabled: params.scrollEnabled,
  single: params.single,
  springDamping: params.springDamping || 0.8,
  startFromShortForm: params.startFromShortForm || false,
  topOffset: params.topOffset === 0 ? 0 : params.topOffset || sharedCoolModalTopOffset,
  transitionDuration: params.transitionDuration || 0.35,
});

export const backupSheetSizes = {
  long: IS_ANDROID
    ? deviceUtils.dimensions.height - safeAreaInsetValues.top
    : deviceUtils.dimensions.height + safeAreaInsetValues.bottom + sharedCoolModalTopOffset + SheetHandleFixedToTopHeight,
  medium: 550,
  short: 424,
  check_identifier: 414,
  shorter: 364,
};

export const getHeightForStep = (step: string) => {
  switch (step) {
    case WalletBackupStepTypes.create_cloud_backup:
    case WalletBackupStepTypes.restore_from_backup:
      return backupSheetSizes.long;
    case WalletBackupStepTypes.backup_prompt:
      return backupSheetSizes.medium;
    case WalletBackupStepTypes.check_identifier:
      return backupSheetSizes.check_identifier;
    default:
      return backupSheetSizes.short;
  }
};

export const checkIdentifierSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ navigation, route }) => {
    const { params: { longFormHeight, step, ...params } = {} } = route as {
      params: any;
    };

    const heightForStep = getHeightForStep(step);
    if (longFormHeight !== heightForStep) {
      navigation.setParams({
        longFormHeight: heightForStep,
      });
    }

    return buildCoolModalConfig({
      ...params,
      longFormHeight: heightForStep,
    });
  },
};

export const backupSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ navigation, route }) => {
    const { params: { longFormHeight, step, ...params } = {} } = route as {
      params: any;
    };

    const heightForStep = getHeightForStep(step);
    if (longFormHeight !== heightForStep) {
      navigation.setParams({
        longFormHeight: heightForStep,
      });
    }

    return buildCoolModalConfig({
      ...params,
      longFormHeight: heightForStep,
    });
  },
};

export const swapDetailsSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      springDamping: 1,
      transitionDuration: 0.25,
    }),
  }),
};

export const transactionDetailsConfig: PartialNavigatorConfigOptions = {
  options: ({ route }) => {
    return buildCoolModalConfig({
      longFormHeight: 0,
      ...route.params,
      scrollEnabled: false,
    });
  },
};

export const opRewardsSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route }) => {
    return buildCoolModalConfig({
      ...route.params,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.3,
    });
  },
};

export const nftOffersSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
    }),
  }),
};

export const nftSingleOfferSheetConfig = {
  options: ({
    route: {
      params: { longFormHeight, ...params },
    },
  }: {
    route: { params: any };
  }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: longFormHeight || -1 * safeAreaInsetValues.bottom,
    }),
  }),
};

export const appIconUnlockSheetConfig = {
  options: ({
    route: {
      params: { longFormHeight, ...params },
    },
  }: {
    route: { params: any };
  }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: longFormHeight || -1 * safeAreaInsetValues.bottom,
    }),
  }),
};

export const mintsSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
    }),
  }),
};

export const consoleSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      cornerRadius: 0,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const panelConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.7,
      cornerRadius: 0,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const airdropsSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.7,
      cornerRadius: 0,
      headerHeight: safeAreaInsetValues.top + 70,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const claimAirdropSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.8,
      cornerRadius: 0,
      headerHeight: safeAreaInsetValues.top + 70,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const expandedAssetSheetV2Config = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      cornerRadius: 'device',
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const swapConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.9,
      cornerRadius: 0,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const signTransactionSheetConfig = {
  options: ({ route }: { route: RouteProp<RootStackParamList, typeof Routes.CONFIRM_REQUEST> }) => ({
    ...buildCoolModalConfig({
      ...route.params,
      backgroundOpacity: [RequestSource.WALLETCONNECT, RequestSource.MOBILE_WALLET_PROTOCOL].includes(route?.params?.source) ? 1 : 0.7,
      cornerRadius: 0,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const walletDiagnosticsSheetConfig = {
  options: ({ route }: { route: { params: any } }) => {
    return buildCoolModalConfig({
      ...route.params,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.3,
    });
  },
};

export const customGasSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      springDamping: 1,
      transitionDuration: 0.25,
    }),
  }),
};

export const positionSheetConfig = {
  options: ({ route: { params = {} } }: { route: { params: any } }) => {
    const height = getPositionSheetHeight(params);
    return {
      ...buildCoolModalConfig({
        ...params,
        longFormHeight: height,
      }),
    };
  },
};

export const sendConfirmationSheetConfig = {
  options: ({ route: { params = {} } }) => {
    const height = getSendConfirmationSheetHeight(params as any);
    return {
      ...buildCoolModalConfig({
        ...params,
        longFormHeight: height,
      }),
    };
  },
};

export const settingsSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: false,
      springDamping: 1,
    }),
  }),
};

export const recieveModalSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: false,
      springDamping: 1,
    }),
  }),
};

export const qrScannerConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      cornerRadius: 'device',
      scrollEnabled: true,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.25,
    }),
  }),
};

export const pairHardwareWalletNavigatorConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.2,
    }),
  }),
};

export const hardwareWalletTxNavigatorConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT,
      backgroundOpacity: 1,
      scrollEnabled: false,
      springDamping: 1,
      transitionDuration: 0.2,
    }),
  }),
};

export const registerENSNavigatorConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.3,
    }),
  }),
};

export const addWalletNavigatorConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      springDamping: 1,
      transitionDuration: 0.3,
    }),
  }),
};

export const learnWebViewScreenConfig: PartialNavigatorConfigOptions & {
  options: BottomSheetNavigationOptions;
} = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: false,
      springDamping: 1,
      transitionDuration: 0.3,
    }),
  }),
};

export const promoSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.3,
    }),
  }),
};

export const profileConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.3,
    }),
  }),
};

export const profilePreviewConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0,
      disableShortFormAfterTransitionToLongForm: true,
      isShortFormEnabled: true,
      scrollEnabled: true,
      // @ts-ignore
      shortFormHeight: 281 + params.descriptionProfilePreviewHeight,
      springDamping: 1,
      startFromShortForm: true,
      transitionDuration: 0.3,
    }),
  }),
};

export const ensConfirmRegisterSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      longFormHeight: ENSConfirmRegisterSheetHeight,
      ...params,
    }),
  }),
};

export const ensAdditionalRecordsSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: getENSAdditionalRecordsSheetHeight(),
    }),
  }),
};

export const explainSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route }) => {
    const params = route.params as ExplainSheetRouteParams;
    const explainerConfig = getExplainSheetConfig(params);
    return buildCoolModalConfig({
      ...params,
      longFormHeight: ExplainSheetHeight + (explainerConfig?.extraHeight ? explainerConfig?.extraHeight : 0),
    });
  },
};

export const externalLinkWarningSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => {
    return buildCoolModalConfig({
      ...params,
      longFormHeight: ExternalLinkWarningSheetHeight,
    });
  },
};

export const expandedAssetSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.28,
    }),
  }),
};

export const expandedAssetSheetConfigWithLimit: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      scrollEnabled: true,
      springDamping: 1,
      transitionDuration: 0.28,
    }),
    limitActiveModals: true,
  }),
};

export const restoreSheetConfig: PartialNavigatorConfigOptions = {
  // @ts-ignore
  options: ({ route: { params: { longFormHeight, ...params } = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      height: backupSheetSizes.long,
    }),
  }),
};

export const basicSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      headerHeight: 0,
      topOffset: 0,
    }),
  }),
};

export const portalSheetConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.8,
      cornerRadius: 0,
      headerHeight: safeAreaInsetValues.top + 70,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const tokenLauncherConfig: PartialNavigatorConfigOptions = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      cornerRadius: 0,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
    dismissable: false,
    gestureEnabled: false,
  }),
};

export const kingOfTheHillExplainSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0.8,
      cornerRadius: 0,
      headerHeight: safeAreaInsetValues.top + 70,
      springDamping: 1,
      topOffset: 0,
      transitionDuration: 0.3,
    }),
  }),
};

export const stackNavigationConfig = {
  headerMode: 'none',
  keyboardHandlingEnabled: ios,
  mode: 'modal',
};

export const defaultScreenStackOptions: StackNavigationOptions = {
  animationTypeForReplace: 'pop',
  gestureEnabled: true,
  presentation: 'transparentModal',
};

export const closeKeyboardOnClose = {
  listeners: {
    // @ts-ignore
    transitionEnd: ({ data: { closing } }) => {
      closing && android && Keyboard.dismiss();
    },
  },
};

export const nativeStackDefaultConfig: CoolModalConfigOptions = {
  allowsDragToDismiss: true,
  backgroundColor: colors.themedColors?.stackBackground,
  backgroundOpacity: 1,
  customStack: true,
  headerHeight: 0,
  ignoreBottomOffset: true,
  springDamping: 1,
  topOffset: 0,
  transitionDuration: 0.3,
};

export const nativeStackDefaultConfigWithoutStatusBar: CoolModalConfigOptions = {
  ...nativeStackDefaultConfig,
  onWillDismiss: () => {
    onWillPop();
  },
};

const BackArrow = styled(Icon).attrs({
  color: colors.themedColors?.appleBlue,
  direction: 'left',
  name: 'caret',
})({
  marginLeft: 15,
  marginRight: 5,
  marginTop: android ? 12 : 0.5,
});

const BackImage = () => <BackArrow />;

const headerConfigOptions = {
  headerBackTitleStyle: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: Number(fonts.size.large),
    fontWeight: fonts.weight.medium as any,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  headerLeftContainerStyle: {
    paddingLeft: 4,
  },
  headerRightContainerStyle: {
    paddingRight: 4,
  },
  ...(android && {
    headerRightContainerStyle: {
      paddingTop: 6,
    },
    headerTitleAlign: 'center',
  }),
  headerTitleStyle: {
    color: colors.themedColors?.dark ?? 'black',
    fontFamily: fonts.family.SFProRounded,
    fontSize: Number(fonts.size.large),
    fontWeight: fonts.weight.heavy as any,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
};

const SettingsTitle = ({ children }: React.PropsWithChildren) => {
  const { colors } = useTheme();

  return (
    <Box paddingTop={IS_ANDROID ? '8px' : undefined}>
      <Text align="center" color={colors.dark} letterSpacing="roundedMedium" size="large" weight="heavy">
        {children}
      </Text>
    </Box>
  );
};

export const settingsOptions = (colors: any, isSettingsRoute = true): StackNavigationOptions => ({
  ...headerConfigOptions,
  headerTitleAlign: 'center',
  cardShadowEnabled: false,
  cardStyle: {
    backgroundColor: colors.cardBackdrop,
    overflow: 'visible',
  },
  gestureEnabled: true,
  headerBackTitle: ' ',
  headerStatusBarHeight: 0,
  ...(isSettingsRoute
    ? {
        headerStyle: {
          backgroundColor: colors.cardBackdrop,
          elevation: 0,
          height: 60,
          shadowColor: 'transparent',
        },
        headerBackImage: BackImage,
      }
    : {
        headerStyle: {
          backgroundColor: colors.transparent,
          height: 0,
        },
        headerBackImage: () => <></>,
      }),
  headerTitle: (props: any) => <SettingsTitle {...props} />,
});
