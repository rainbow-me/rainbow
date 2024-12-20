import { BlurView } from '@react-native-community/blur';
import ConditionalWrap from 'conditional-wrap';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { AnimatedRef, runOnJS, runOnUI, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { AnimatedText, Bleed, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import * as i18n from '@/languages';
import { useBrowserStore } from '@/state/browser/browserStore';
import position from '@/styles/position';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { haptics, showActionSheetWithOptions } from '@/utils';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { RAINBOW_HOME } from '../constants';
import { useSearchContext } from '../search/SearchContext';

const TAB_BUTTON_SIZE = 44;

type MenuActionKey = 'closeAllTabs' | 'closeThisTab' | 'newTab';

export const TabButton = React.memo(function TabButton({
  inputRef,
  toggleTabViewWorklet,
}: {
  inputRef: AnimatedRef<TextInput>;
  toggleTabViewWorklet(tabIndex?: number): void;
}) {
  const { activeTabId, currentlyOpenTabIds, goToUrl, loadProgress } = useBrowserContext();
  const { closeAllTabsWorklet, closeTabWorklet, newTabWorklet } = useBrowserWorkletsContext();
  const { isFocused } = useSearchContext();

  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');

  const isFocusedState = useSharedValueState(isFocused, { initialValue: false });

  const numberOfClosableTabs = useBrowserStore(state => {
    if (state.tabIds.length === 1 && state.isOnHomepage()) {
      return 0;
    }
    return state.tabIds.length;
  });

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;
  const label = useForegroundColor('label');
  const labelSecondary = useForegroundColor('labelSecondary');

  const tabButtonIcon = useDerivedValue<string>(() => (isFocused.value ? '􀆈' : '􀐅'));
  const tabButtonIconStyle = useAnimatedStyle(() => ({ color: isFocused.value ? labelSecondary : label }));

  const blurInput = useCallback(() => {
    inputRef.current?.blur();
  }, [inputRef]);

  const onPressWorklet = useCallback(() => {
    'worklet';
    if (!isFocused.value) {
      toggleTabViewWorklet();
    } else {
      runOnJS(blurInput)();
    }
  }, [blurInput, isFocused, toggleTabViewWorklet]);

  const longPressMenuConfig = useMemo(() => {
    let closeAllTabsTitle: string;
    switch (numberOfClosableTabs) {
      case 1:
        closeAllTabsTitle = i18n.t(i18n.l.dapp_browser.menus.close_this_tab);
        break;
      case 2:
        closeAllTabsTitle = i18n.t(i18n.l.dapp_browser.menus.close_both_tabs);
        break;
      default:
        closeAllTabsTitle = i18n.t(i18n.l.dapp_browser.menus.close_all_tabs, { numberOfClosableTabs });
    }

    const menuItems = [
      // Close all tabs option
      ...(numberOfClosableTabs > 1
        ? [
            {
              actionKey: 'closeAllTabs',
              actionTitle: closeAllTabsTitle,
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'xmark',
              },
              menuAttributes: ['destructive' as const],
            },
          ]
        : []),

      // Close this tab
      ...(numberOfClosableTabs > 0
        ? [
            {
              actionKey: 'closeThisTab',
              actionTitle: i18n.t(i18n.l.dapp_browser.menus.close_this_tab),
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'xmark',
              },
              menuAttributes: ['destructive' as const],
            },
          ]
        : []),

      // New tab (always present)
      {
        actionKey: 'newTab',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.new_tab),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'plus.square.on.square',
        },
      },
    ];

    return {
      menuTitle: '',
      menuItems,
    };
  }, [numberOfClosableTabs]);

  const goHome = useCallback(() => {
    goToUrl(RAINBOW_HOME);
    loadProgress.value = 0;
  }, [goToUrl, loadProgress]);

  const onPressMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: MenuActionKey } }) => {
      haptics.selection();
      if (actionKey === 'closeThisTab') {
        runOnUI(() => {
          const multipleTabsOpen = currentlyOpenTabIds.value.length > 1;
          if (multipleTabsOpen) {
            const tabId = activeTabId.value;
            const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
            currentlyOpenTabIds.modify(value => {
              value.splice(tabIndex, 1);
              return value;
            });
            closeTabWorklet({ tabId, tabIndex });
          } else {
            runOnJS(goHome)();
          }
        })();
      } else if (actionKey === 'closeAllTabs') {
        runOnUI(closeAllTabsWorklet)();
      } else if (actionKey === 'newTab') {
        runOnUI(newTabWorklet)({ newTabUrl: RAINBOW_HOME });
      }
    },
    [activeTabId, closeAllTabsWorklet, closeTabWorklet, currentlyOpenTabIds, goHome, newTabWorklet]
  );

  const onLongPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        ...{ cancelButtonIndex: longPressMenuConfig.menuItems.length - 1 },
        options: longPressMenuConfig.menuItems.map(item => item?.actionTitle),
      },
      (buttonIndex: number) => {
        onPressMenuItem({ nativeEvent: { actionKey: longPressMenuConfig.menuItems[buttonIndex]?.actionKey as MenuActionKey } });
      }
    );
  }, [longPressMenuConfig, onPressMenuItem]);

  return (
    <BrowserButtonShadows borderRadius={TAB_BUTTON_SIZE / 2} hideDarkModeShadows>
      <Bleed space="8px">
        <ConditionalWrap
          condition={IS_IOS}
          wrap={children => (
            <ContextMenuButton
              enableContextMenu={IS_IOS ? !isFocusedState : undefined}
              isMenuPrimaryAction={IS_IOS ? isFocusedState : undefined}
              menuConfig={longPressMenuConfig}
              onPressMenuItem={onPressMenuItem}
            >
              {children}
            </ContextMenuButton>
          )}
        >
          <GestureHandlerButton
            onLongPressJS={IS_IOS || isFocusedState ? undefined : onLongPressAndroid}
            onPressWorklet={onPressWorklet}
            style={{ padding: 8 }}
          >
            <Box
              borderRadius={TAB_BUTTON_SIZE / 2}
              style={{ height: TAB_BUTTON_SIZE, paddingTop: isFocusedState ? 1 : undefined, width: TAB_BUTTON_SIZE }}
              alignItems="center"
              justifyContent="center"
            >
              <BlurLayer buttonColor={buttonColor} />
              <AnimatedText align="center" size="icon 17px" style={[styles.tabButtonIcon, tabButtonIconStyle]} weight="heavy">
                {tabButtonIcon}
              </AnimatedText>
            </Box>
          </GestureHandlerButton>
        </ConditionalWrap>
      </Bleed>
    </BrowserButtonShadows>
  );
});

const BlurLayer = memo(function BlurLayer({ buttonColor }: { buttonColor: string }) {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <>
      {IS_IOS && <Box as={BlurView} blurAmount={20} blurType={isDarkMode ? 'dark' : 'light'} style={styles.blurLayer} />}
      <Box
        style={[
          styles.blurTint,
          {
            backgroundColor: buttonColor,
            borderColor: separatorSecondary,
            borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
          },
        ]}
      />
    </>
  );
});

const styles = StyleSheet.create({
  blurLayer: {
    ...position.coverAsObject,
    borderRadius: TAB_BUTTON_SIZE / 2,
    elevation: -1,
    zIndex: -1,
  },
  blurTint: {
    ...position.coverAsObject,
    borderRadius: TAB_BUTTON_SIZE / 2,
    zIndex: -1,
  },
  tabButtonIcon: {
    width: TAB_BUTTON_SIZE,
  },
});
