import { MenuView } from '@react-native-menu/menu';
import React, { useMemo } from 'react';
import { useLatestCallback } from '@/hooks';

export default function ContextMenuAndroid({
  children,
  menuConfig: { menuItems, menuTitle },
  isAnchoredToRight,
  onPressMenuItem,
  shouldOpenOnLongPress,
  style,
  testID,
}) {
  const actions = useMemo(() => {
    const items = [];

    if (menuTitle) {
      items.push({
        attributes: {
          disabled: true,
        },
        id: 'title',
        title: menuTitle,
      });
    }

    if (menuItems) {
      items.push(
        ...(menuItems || []).map(item => ({
          id: item.actionKey,
          image: item.icon?.iconValue,
          title: item.actionTitle || item.menuTitle,
          ...(item.menuTitle && {
            titleColor: 'black',
            subactions: item.menuItems.map(item => ({
              id: item.actionKey,
              image: item.icon?.iconValue,
              title: item.actionTitle,
            })),
          }),
        }))
      );
    }

    return items;
  }, [menuItems, menuTitle]);

  const onPressAction = useLatestCallback(
    ({ nativeEvent: { event } }) => {
      return onPressMenuItem({ nativeEvent: { actionKey: event } });
    },
    [onPressMenuItem]
  );

  return (
    <MenuView
      actions={actions}
      isAnchoredToRight={isAnchoredToRight}
      onPressAction={onPressAction}
      shouldOpenOnLongPress={shouldOpenOnLongPress}
      style={style}
      testID={testID}
    >
      {children}
    </MenuView>
  );
}
