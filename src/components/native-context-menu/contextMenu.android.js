import { MenuView } from '@react-native-menu/menu';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { lightModeThemeColors } from '@/styles';

export default function ContextMenuAndroid({
  children,
  menuConfig: { menuItems, menuTitle },
  ...rest
}) {
  const actions = useMemo(() => {
    return [
      {
        disabled: true,
        id: 'title',
        title: menuTitle,
      },
    ].concat(
      menuItems.map(item => {
        return {
          id: item.actionKey,
          image: item.icon?.iconValue,
          title: item.actionTitle,
        };
      })
    );
  }, [menuItems]);

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        console.warn(JSON.stringify(nativeEvent));
      }}
    >
      {children}
    </MenuView>
  );
}
