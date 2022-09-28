import React from 'react';
import { Keyboard } from 'react-native';
import BackButton from '../components/header/BackButton';
import { Icon } from '../components/icons';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import { Text } from '../components/text';
import { getENSAdditionalRecordsSheetHeight } from '../screens/ENSAdditionalRecordsSheet';
import { ENSConfirmRegisterSheetHeight } from '../screens/ENSConfirmRegisterSheet';
import { explainers, ExplainSheetHeight } from '../screens/ExplainSheet';
import { ExternalLinkWarningSheetHeight } from '../screens/ExternalLinkWarningSheet';
import { getSheetHeight as getSendConfirmationSheetHeight } from '../screens/SendConfirmationSheet';
import { useTheme } from '../theme/ThemeContext';
import colors from '../theme/currentColors';
import { onWillPop } from './Navigation';
import networkInfo from '@/helpers/networkInfo';
import networkTypes from '@/helpers/networkTypes';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import styled from '@/styled-thing';
import { fonts } from '@/styles';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

export const sharedCoolModalTopOffset = safeAreaInsetValues.top;

const buildCoolModalConfig = params => ({
  allowsDragToDismiss: true,
  allowsTapToDismiss: true,
  backgroundColor: params.backgroundColor || colors.themedColors.shadowBlack,
  backgroundOpacity: params.backgroundOpacity || 0.7,
  blocksBackgroundTouches: true,
  cornerRadius:
    params.cornerRadius === 'device'
      ? android
        ? 30
        : 0.666 // 0.666 gets the screen corner radius internally
      : params.cornerRadius === 0
      ? 0
      : params.cornerRadius || 39,
  customStack: true,
  disableShortFormAfterTransitionToLongForm:
    params.disableShortFormAfterTransitionToLongForm ||
    params?.type === 'token' ||
    params?.type === 'uniswap',
  gestureEnabled: true,
  headerHeight: params.headerHeight || 25,
  ignoreBottomOffset: true,
  isShortFormEnabled: params.isShortFormEnabled || params?.type === 'token',
  longFormHeight: params.longFormHeight,
  onAppear: params.onAppear || null,
  scrollEnabled: params.scrollEnabled,
  single: params.single,
  springDamping: params.springDamping || 0.8,
  startFromShortForm:
    params.startFromShortForm || params?.type === 'token' || false,
  topOffset:
    params.topOffset === 0 ? 0 : params.topOffset || sharedCoolModalTopOffset,
  transitionDuration: params.transitionDuration || 0.35,
});

const backupSheetSizes = {
  long:
    deviceUtils.dimensions.height +
    safeAreaInsetValues.bottom +
    sharedCoolModalTopOffset +
    SheetHandleFixedToTopHeight,
  short: 394,
};

export const backupSheetConfig = {
  options: ({ navigation, route }) => {
    const { params: { longFormHeight, step, ...params } = {} } = route;

    let heightForStep = backupSheetSizes.short;
    if (
      step === WalletBackupStepTypes.cloud ||
      step === WalletBackupStepTypes.manual
    ) {
      heightForStep = backupSheetSizes.long;
    } else if (
      // on the "existing_user" step, our "description" text is 1 extra line of text
      // vertically, so we want to increase the sheet height by 1 lineHeight here
      step === WalletBackupStepTypes.existing_user
    ) {
      // TODO: measure this text programatically
      heightForStep = backupSheetSizes.short + fonts.lineHeight.looser;
    }

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

export const customGasSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      springDamping: 1,
      transitionDuration: 0.25,
    }),
  }),
};

export const addTokenSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: 394,
    }),
  }),
};

export const sendConfirmationSheetConfig = {
  options: ({ route: { params = {} } }) => {
    const height = getSendConfirmationSheetHeight(params);
    return {
      ...buildCoolModalConfig({
        ...params,
        longFormHeight: height,
      }),
    };
  },
};

export const settingsSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 1,
      scrollEnabled: false,
      springDamping: 1,
    }),
  }),
};

export const pairHardwareWalletNavigatorConfig = {
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

export const registerENSNavigatorConfig = {
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

export const swapsPromoSheetConfig = {
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

export const profileConfig = {
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

export const profilePreviewConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      backgroundOpacity: 0,
      disableShortFormAfterTransitionToLongForm: true,
      isShortFormEnabled: true,
      scrollEnabled: true,
      shortFormHeight: 281 + params.descriptionProfilePreviewHeight,
      springDamping: 1,
      startFromShortForm: true,
      transitionDuration: 0.3,
    }),
  }),
};

export const ensConfirmRegisterSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      longFormHeight: ENSConfirmRegisterSheetHeight,
      ...params,
    }),
  }),
};

export const ensAdditionalRecordsSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      longFormHeight: getENSAdditionalRecordsSheetHeight(),
    }),
  }),
};

export const explainSheetConfig = {
  options: ({
    route: { params = { network: networkInfo[networkTypes.mainnet].name } },
  }) => {
    const explainerConfig = explainers(params.network)[params?.type];
    return buildCoolModalConfig({
      ...params,
      longFormHeight:
        ExplainSheetHeight +
        (explainerConfig?.extraHeight ? explainerConfig?.extraHeight : 0),
    });
  },
};

export const externalLinkWarningSheetConfig = {
  options: ({ route: { params = {} } }) => {
    return buildCoolModalConfig({
      ...params,
      longFormHeight: ExternalLinkWarningSheetHeight,
    });
  },
};

export const expandedAssetSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      scrollEnabled: true,
    }),
  }),
};

export const expandedAssetSheetConfigWithLimit = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      scrollEnabled: true,
    }),
    limitActiveModals: true,
  }),
};

const restoreSheetSizes = {
  ...backupSheetSizes,
  medium: 505,
  short: 363,
};

export const restoreSheetConfig = {
  options: ({ navigation, route }) => {
    const {
      params: {
        enableCloudRestore,
        longFormHeight,
        step = WalletBackupStepTypes.first,
        ...params
      } = {},
    } = route;

    let heightForStep = restoreSheetSizes.short;
    if (enableCloudRestore && step === WalletBackupStepTypes.first) {
      heightForStep = restoreSheetSizes.medium;
    } else if (step === WalletBackupStepTypes.cloud) {
      heightForStep = restoreSheetSizes.long;
    }

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

export const basicSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      headerHeight: 0,
      topOffset: 0,
    }),
  }),
};

export const stackNavigationConfig = {
  headerMode: 'none',
  keyboardHandlingEnabled: ios,
  mode: 'modal',
};

export const defaultScreenStackOptions = {
  animationTypeForReplace: 'pop',
  gestureEnabled: true,
};

export const closeKeyboardOnClose = {
  listeners: {
    transitionEnd: ({ data: { closing } }) => {
      closing && android && Keyboard.dismiss();
    },
  },
};

export const nativeStackDefaultConfig = {
  allowsDragToDismiss: true,
  backgroundColor: colors.themedColors.stackBackground,
  backgroundOpacity: 1,
  customStack: true,
  headerHeight: 0,
  ignoreBottomOffset: true,
  springDamping: 1,
  topOffset: 0,
  transitionDuration: 0.3,
};

export const nativeStackDefaultConfigWithoutStatusBar = {
  ...nativeStackDefaultConfig,
  onWillDismiss: () => {
    onWillPop();
  },
};

export const exchangeTabNavigatorConfig = {
  initialLayout: deviceUtils.dimensions,
  sceneContainerStyle: {
    backgroundColor: 'transparent',
  },
  springConfig: {
    damping: 30,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    stiffness: 300,
  },
  swipeDistanceMinimum: 0,
  swipeVelocityImpact: 1,
  swipeVelocityScale: 1,
  tabBar: () => null,
  transparentCard: true,
};

const BackArrow = styled(Icon).attrs({
  color: colors.themedColors.appleBlue,
  direction: 'left',
  name: 'caret',
})({
  marginLeft: 15,
  marginRight: 5,
  marginTop: android ? 2 : 0.5,
});

const BackImage = () => <BackArrow />;

const headerConfigOptions = {
  headerBackTitleStyle: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.large),
    fontWeight: fonts.weight.medium,
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
    color: colors.themedColors.dark,
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.large),
    fontWeight: fonts.weight.heavy,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
};

const EmptyButtonPlaceholder = styled.View({
  flex: 1,
});

const SettingsTitle = ({ children }) => {
  const { colors } = useTheme();

  return (
    <Text
      align="center"
      color={colors.dark}
      letterSpacing="roundedMedium"
      size="large"
      weight="bold"
    >
      {children}
    </Text>
  );
};

export const wyreWebviewOptions = colors => ({
  ...headerConfigOptions,
  headerLeft: props => <BackButton {...props} textChevron />,
  headerStatusBarHeight: 24,
  headerStyle: {
    backgroundColor: colors.white,
    elevation: 24,
    shadowColor: 'transparent',
  },
  headerTitleStyle: {
    ...headerConfigOptions.headerTitleStyle,
    color: colors.dark,
  },
  title: 'Add Cash',
});

export const settingsOptions = colors => ({
  ...headerConfigOptions,
  cardShadowEnabled: false,
  cardStyle: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  gestureEnabled: ios,
  gestureResponseDistance: { horizontal: deviceUtils.dimensions.width },
  ...(ios && { headerBackImage: BackImage }),
  headerBackTitle: ' ',
  headerStatusBarHeight: 0,
  headerStyle: {
    backgroundColor: ios ? colors.cardBackdrop : 'transparent',
    elevation: 0,
    height: 60,
    shadowColor: 'transparent',
  },
  headerTitleStyle: {
    ...headerConfigOptions.headerTitleStyle,
    color: colors.dark,
  },
  ...(android && {
    headerLeft: props => <BackButton {...props} textChevron />,
    headerRight: () => <EmptyButtonPlaceholder />,
    headerTitle: props => <SettingsTitle {...props} />,
  }),
});
