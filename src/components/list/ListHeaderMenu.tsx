import React from 'react';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, Inline, Text, useForegroundColor } from '@/design-system';
import { NftSort } from '@/hooks/useNFTsSortBy';
import { haptics } from '@/utils';
import { MenuConfig } from 'react-native-ios-context-menu';

type ListHeaderMenuProps = {
  selected: NftSort;
  menuItems: MenuConfig['menuItems'];
  selectItem: (item: string) => void;
  icon: string;
  text: string;
};

export function ListHeaderMenu({ menuItems, selectItem, icon, text }: ListHeaderMenuProps) {
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const menuConfig = {
    menuTitle: '',
    menuItems: menuItems,
  };

  const onPressMenuItem = ({ nativeEvent: { actionKey: item } }: { nativeEvent: { actionKey: string } }) => {
    haptics.selection();
    selectItem(item);
  };

  return (
    <Bleed space="10px">
      <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
        <ButtonPressAnimation style={{ padding: 10 }}>
          <Bleed bottom="2px">
            <Box
              alignItems="center"
              borderRadius={15}
              height={{ custom: 30 }}
              justifyContent="center"
              paddingHorizontal="8px"
              style={{ borderColor: separatorTertiary, borderWidth: 1.5 }}
            >
              <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                <Text align="center" color="labelQuaternary" size="icon 13px" weight="bold">
                  {icon}
                </Text>
                <Text align="center" color="labelTertiary" size="15pt" weight="bold">
                  {text}
                </Text>
                <Text align="center" color="labelQuaternary" size="icon 13px" weight="bold">
                  􀆏
                </Text>
              </Inline>
            </Box>
          </Bleed>
        </ButtonPressAnimation>
      </ContextMenuButton>
    </Bleed>
  );
}
