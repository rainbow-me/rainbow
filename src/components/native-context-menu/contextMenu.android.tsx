import { MenuView, NativeActionEvent } from '@react-native-menu/menu';
import React, { PropsWithChildren, useMemo } from 'react';
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
}: PropsWithChildren<{
  menuConfig: MenuConfig;
  isAnchoredToRight?: boolean;
  onPressMenuItem: (event: { nativeEvent: { actionKey: string } }) => void;
  shouldOpenOnLongPress?: boolean;
  style?: NativeMenuComponentProps['style'];
}>) {
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

  return (
    <MenuView
      actions={actions}
      isAnchoredToRight={isAnchoredToRight}
      onPressAction={onPressAction}
      shouldOpenOnLongPress={shouldOpenOnLongPress}
      style={style}
    >
      {children}
    </MenuView>
  );
}
