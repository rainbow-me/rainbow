import { MenuView, NativeActionEvent, MenuComponentRef } from '@react-native-menu/menu';
import React, { PropsWithChildren, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLatestCallback } from '@/hooks';
import { NativeMenuComponentProps } from '@react-native-menu/menu/lib/typescript/src/types';
import { MenuConfig } from './contextMenu';

export default function ContextMenuAndroid({
  children,
  menuConfig: { menuItems, menuTitle },
  isAnchoredToRight,
  onPressMenuItem,
  shouldOpenOnLongPress,
  style,
  testID,
}: PropsWithChildren<{
  menuConfig: MenuConfig;
  isAnchoredToRight?: boolean;
  onPressMenuItem: (event: { nativeEvent: { actionKey: string } }) => void;
  shouldOpenOnLongPress?: boolean;
  style?: NativeMenuComponentProps['style'];
  testID?: string;
}>) {
  const menuRef = useRef<MenuComponentRef | null>(null);
  const actions = useMemo(() => {
    const items = [];

    if (menuTitle) {
      items.push({
        attributes: { disabled: true },
        id: 'title',
        title: menuTitle,
      });
    }

    if (menuItems) {
      items.push(
        ...(menuItems || []).map(item => ({
          id: item.actionKey,
          image: item.icon?.iconValue,
          title: item.actionTitle || item.menuTitle || '',
          ...(item.menuTitle && {
            titleColor: 'black',
            subactions: item.menuItems.map(item => ({
              id: item.actionKey,
              image: item.icon?.iconValue,
              title: item.actionTitle || '',
            })),
          }),
        }))
      );
    }

    return items;
  }, [menuItems, menuTitle]);

  const onPressAction = useLatestCallback<({ nativeEvent }: NativeActionEvent) => void>(({ nativeEvent: { event } }) => {
    return onPressMenuItem({ nativeEvent: { actionKey: event } });
  });

  const gesture = (shouldOpenOnLongPress ? Gesture.LongPress() : Gesture.Tap()).runOnJS(true).onStart(() => {
    menuRef.current?.show();
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={style} testID={testID}>
        <MenuView
          ref={menuRef}
          actions={actions}
          isAnchoredToRight={isAnchoredToRight}
          onPressAction={onPressAction}
          shouldOpenOnLongPress={shouldOpenOnLongPress}
          // Using the component for touch handling is not reliable, so use RNGH and open manually with the ref.
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
        />
        {children}
      </View>
    </GestureDetector>
  );
}
