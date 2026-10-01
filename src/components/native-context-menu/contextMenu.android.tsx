import React, { useMemo, useRef, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { MenuView, type MenuAction, type MenuComponentRef, type NativeActionEvent } from '@react-native-menu/menu';
import { type NativeMenuComponentProps } from '@react-native-menu/menu/lib/typescript/src/types';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation/ButtonPressAnimation';
import { ButtonPressContext } from '@/components/animations/ButtonPressAnimation/ButtonPressContext';
import useLatestCallback from '@/hooks/useLatestCallback';

import { type MenuActionConfig, type MenuConfig } from './contextMenu';

function toMenuAction(item: MenuActionConfig): MenuAction {
  return {
    id: item.actionKey,
    title: item.actionTitle || item.menuTitle || '',
    image: item.icon?.iconValue,
    state: item.menuState === 'on' ? 'on' : item.menuState === 'off' ? 'off' : item.menuState === 'mixed' ? 'mixed' : undefined,
    attributes: {
      destructive: item.menuAttributes?.includes('destructive'),
      disabled: item.menuAttributes?.includes('disabled'),
      hidden: item.menuAttributes?.includes('hidden'),
    },
    ...(item.menuItems && { subactions: item.menuItems.map(toMenuAction) }),
  };
}

/** Opens native menus through the same press handling as their animated child buttons. */
export default function ContextMenuAndroid({
  children,
  enableContextMenu = true,
  menuConfig: { menuItems, menuTitle },
  isAnchoredToRight,
  isMenuPrimaryAction = true,
  onPressMenuItem,
  shouldOpenOnLongPress = !isMenuPrimaryAction,
  style,
  testID,
}: PropsWithChildren<{
  enableContextMenu?: boolean;
  menuConfig: MenuConfig;
  isAnchoredToRight?: boolean;
  isMenuPrimaryAction?: boolean;
  onPressMenuItem: (event: { nativeEvent: { actionKey: string } }) => void;
  shouldOpenOnLongPress?: boolean;
  style?: NativeMenuComponentProps['style'];
  testID?: string;
}>) {
  const menuRef = useRef<MenuComponentRef | null>(null);
  const actions = useMemo(() => {
    const items = menuItems.map(toMenuAction);
    if (menuTitle) items.unshift({ attributes: { disabled: true }, id: 'title', title: menuTitle });
    return items;
  }, [menuItems, menuTitle]);

  const onPressAction = useLatestCallback<({ nativeEvent }: NativeActionEvent) => void>(({ nativeEvent: { event } }) => {
    onPressMenuItem({ nativeEvent: { actionKey: event } });
  });
  const openMenu = useLatestCallback(() => {
    if (enableContextMenu) menuRef.current?.show();
  });
  const buttonActions = useMemo(
    () => ({
      onPress: enableContextMenu && !shouldOpenOnLongPress ? openMenu : null,
      onLongPress: enableContextMenu && shouldOpenOnLongPress ? openMenu : null,
    }),
    [enableContextMenu, openMenu, shouldOpenOnLongPress]
  );

  const content = <ButtonPressContext.Provider value={buttonActions}>{children}</ButtonPressContext.Provider>;
  if (!enableContextMenu) {
    return (
      <View style={style} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <ButtonPressAnimation
      enableHapticFeedback={false}
      importantForAccessibility="no"
      onPress={buttonActions.onPress}
      onLongPress={buttonActions.onLongPress}
      scaleTo={1}
      wrapperStyle={style}
      testID={testID}
    >
      <MenuView
        ref={menuRef}
        actions={actions}
        isAnchoredToRight={isAnchoredToRight}
        onPressAction={onPressAction}
        // MenuView intercepts child touches; the button owns activation instead.
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      />
      {content}
    </ButtonPressAnimation>
  );
}
