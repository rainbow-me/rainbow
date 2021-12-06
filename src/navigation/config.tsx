import React from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/header/BackButton' was resol... Remove this comment to see the full error message
import BackButton from '../components/header/BackButton';
import { Icon } from '../components/icons';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import { Text } from '../components/text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import colors from '../context/currentColors';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/ExplainSheet' was resolved to '... Remove this comment to see the full error message
import { explainers, ExplainSheetHeight } from '../screens/ExplainSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../screens/SendConfirmationSheet' was reso... Remove this comment to see the full error message
import { SendConfirmationSheetHeight } from '../screens/SendConfirmationSheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Navigation' was resolved to '/Users/nick... Remove this comment to see the full error message
import { onWillPop } from './Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils, safeAreaInsetValues } from '@rainbow-me/utils';

export const sharedCoolModalTopOffset = safeAreaInsetValues.top;

const buildCoolModalConfig = (params: any) => ({
  allowsDragToDismiss: true,
  allowsTapToDismiss: true,
  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
  backgroundColor: params.backgroundColor || colors.themedColors.shadowBlack,
  backgroundOpacity: params.backgroundOpacity || 0.7,
  blocksBackgroundTouches: true,

  cornerRadius:
    params.cornerRadius === 'device'
      ? // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        android
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
  options: ({ navigation, route }: any) => {
    // @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
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

export const customGasSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'shouldShowChecks' does not exist on type... Remove this comment to see the full error message
    let height = params.shouldShowChecks
      ? SendConfirmationSheetHeight
      : SendConfirmationSheetHeight - 104;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isL2' does not exist on type '{}'.
    if (!params.isL2) {
      height -= 59;
    }
    return {
      ...buildCoolModalConfig({
        ...params,
        longFormHeight: height,
      }),
    };
  },
};

export const explainSheetConfig = {
  options: ({ route: { params = {} } }) => {
    return buildCoolModalConfig({
      ...params,
      longFormHeight:
        ExplainSheetHeight +
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
        (explainers[params?.type]?.extraHeight
          ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
            explainers[params?.type]?.extraHeight
          : 0),
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
  options: ({ navigation, route }: any) => {
    const {
      params: {
        // @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
        enableCloudRestore,
        // @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      backgroundColor: colors.themedColors.dark,
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  keyboardHandlingEnabled: ios,
  mode: 'modal',
};

export const defaultScreenStackOptions = {
  animationTypeForReplace: 'pop',
  gestureEnabled: true,
};

export const closeKeyboardOnClose = {
  listeners: {
    transitionEnd: ({ data: { closing } }: any) => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      closing && android && Keyboard.dismiss();
    },
  },
};

export const nativeStackDefaultConfig = {
  allowsDragToDismiss: true,
  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
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

const transitionConfig = {
  damping: 35,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
  stiffness: 450,
};

const BackArrow = styled(Icon).attrs({
  // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
  color: colors.themedColors.appleBlue,
  direction: 'left',
  name: 'caret',
})`
  margin-left: 15;
  margin-right: 5;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 2 : 0.5};
`;
// @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
const BackImage = () => <BackArrow />;

const headerConfigOptions = {
  headerBackTitleStyle: {
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.large),
    fontWeight: fonts.weight.medium,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ...(android && {
    headerRightContainerStyle: {
      paddingTop: 6,
    },
    headerTitleAlign: 'center',
  }),
  headerTitleStyle: {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    color: colors.themedColors.dark,
    fontFamily: fonts.family.SFProRounded,
    fontSize: parseFloat(fonts.size.large),
    fontWeight: fonts.weight.bold,
    letterSpacing: fonts.letterSpacing.roundedMedium,
  },
};

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const EmptyButtonPlaceholder = styled.View`
  flex: 1;
`;

const SettingsTitle = ({ children }: any) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

export const wyreWebviewOptions = (colors: any) => ({
  ...headerConfigOptions,
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  headerLeft: (props: any) => <BackButton {...props} textChevron />,
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

export const settingsOptions = (colors: any) => ({
  ...headerConfigOptions,
  cardShadowEnabled: false,

  cardStyle: {
    backgroundColor: colors.white,
    overflow: 'visible',
  },

  gestureEnabled: true,
  gestureResponseDistance: { horizontal: deviceUtils.dimensions.width },
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  ...(ios && { headerBackImage: BackImage }),
  headerBackTitle: 'Back',
  headerStatusBarHeight: 0,

  headerStyle: {
    backgroundColor: 'transparent',
    elevation: 0,
    height: 49,
    shadowColor: 'transparent',
  },

  headerTitleStyle: {
    ...headerConfigOptions.headerTitleStyle,
    color: colors.dark,
  },

  transitionSpec: {
    close: {
      animation: 'spring',
      config: transitionConfig,
    },
    open: {
      animation: 'spring',
      config: transitionConfig,
    },
  },

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ...(android && {
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    headerLeft: (props: any) => <BackButton {...props} textChevron />,
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    headerRight: () => <EmptyButtonPlaceholder />,
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    headerTitle: (props: any) => <SettingsTitle {...props} />,
  }),
});
