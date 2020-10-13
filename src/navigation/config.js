import { Keyboard, Platform, StatusBar } from 'react-native';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import { onDidPop, onWillPop } from './Navigation';
import { appearListener } from './nativeStackHelpers';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { colors, fonts } from '@rainbow-me/styles';
import { deviceUtils, safeAreaInsetValues } from '@rainbow-me/utils';

export const sharedCoolModalTopOffset = safeAreaInsetValues.top + 5;

const buildCoolModalConfig = params => ({
  allowsDragToDismiss: true,
  allowsTapToDismiss: true,
  backgroundOpacity: 0.7,
  blocksBackgroundTouches: true,
  cornerRadius: params.longFormHeight ? 39 : 30,
  customStack: true,
  gestureEnabled: true,
  headerHeight: params.headerHeight || 25,
  ignoreBottomOffset: true,
  isShortFormEnabled: params.isShortFormEnabled,
  longFormHeight: params.longFormHeight,
  onAppear: params.onAppear || null,
  scrollEnabled: params.scrollEnabled,
  single: params.single,
  TEMPORARY_autoJumpToNewHeight: params.TEMPORARY_autoJumpToNewHeight,
  topOffset: params.topOffset || sharedCoolModalTopOffset,
});

export const nativeStackConfig = {
  mode: 'modal',
  screenOptions: {
    contentStyle: {
      backgroundColor: 'transparent',
    },
    onAppear: () => {
      appearListener.current && appearListener.current();
    },
    onDismissed: onDidPop,
    onTouchTop: ({ nativeEvent: { dismissing } }) => {
      if (dismissing) {
        Keyboard.dismiss();
      } else {
        appearListener.current && appearListener.current();
      }
    },
    onWillDismiss: () => {
      onWillPop();
      StatusBar.setBarStyle('dark-content');
    },
    showDragIndicator: false,
    springDamping: 0.8,
    stackPresentation: 'modal',
    transitionDuration: 0.35,
  },
};

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

export const expandedAssetSheetConfig = {
  options: ({ route: { params = {} } }) => ({
    ...buildCoolModalConfig({
      ...params,
      scrollEnabled: true,
    }),
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
      backgroundColor: colors.dark,
      longFormHeight: heightForStep,
      TEMPORARY_autoJumpToNewHeight: true,
    });
  },
};

export const savingsSheetConfig = {
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
  keyboardHandlingEnabled: Platform.OS === 'ios',
  mode: 'modal',
};

export const defaultScreenStackOptions = {
  animationTypeForReplace: 'pop',
  gestureEnabled: true,
};

export const nativeStackDefaultConfig = {
  allowsDragToDismiss: true,
  backgroundColor: '#0A0A0A',
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
