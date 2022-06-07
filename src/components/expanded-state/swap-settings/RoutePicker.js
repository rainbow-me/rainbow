import lang from 'i18n-js';
import React, { useCallback } from 'react';
import RainbowExchange from '../../../assets/exchanges/Both.png';
import OneInchExchange from '../../../assets/exchanges/oneinch.png';
import ZeroXExchange from '../../../assets/exchanges/zerox.png';
import { ContextMenuButton } from '../../context-menu';
import { Column, Columns, Inline, Text } from '@rainbow-me/design-system';

import { ImgixImage } from '@rainbow-me/images';
import { SwapRoute } from '@rainbow-me/redux/swap';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const routeMenuItems = () => {
  return Object.values(SwapRoute).map(route => ({
    actionKey: route,
    actionTitle: Object.keys(SwapRoute).find(key => SwapRoute[key] === route),
    icon: {
      iconType: 'ASSET',
      iconValue: `${route}`,
    },
  }));
};

const androidRouteMenuItems = () => {
  return Object.values(SwapRoute);
};

export default function SwapSettingsState({ onSelect, swapRoute }) {
  const [currentRoute, setCurrentRoute] = React.useState(swapRoute);

  const imageSource = useMemo(() => {
    let source = null;
    switch (currentRoute) {
      case SwapRoute['1inch']:
        source = OneInchExchange;
        break;
      case SwapRoute['0x']:
        source = ZeroXExchange;
        break;
      default:
        source = RainbowExchange;
        break;
    }

    return source;
  }, [currentRoute]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      setCurrentRoute(actionKey);
      onSelect(actionKey);
    },
    [onSelect]
  );
  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: androidRouteMenuItems,
        showSeparators: true,
      },
      idx => {
        if (idx !== undefined) {
          const routeOptions = androidRouteMenuItems();
          setCurrentRoute(routeOptions[idx]);
          onSelect(routeOptions[idx]);
        }
      }
    );
  }, [onSelect]);

  return (
    <Columns alignHorizontal="justify" alignVertical="center">
      <Column>
        <Text size="18px" weight="bold">
          Route swaps via
        </Text>
      </Column>
      <Column width="content">
        <ContextMenuButton
          menuItems={routeMenuItems()}
          menuTitle=""
          onPressAndroid={onPressAndroid}
          onPressMenuItem={handleOnPressMenuItem}
        >
          <Inline alignVertical="center" horizontalSpace="4px">
            <ImgixImage
              height={20}
              source={imageSource}
              style={{
                height: 20,
                width: 20,
              }}
              width={20}
            />
            <Text size="18px" weight="bold">
              {`${Object.keys(SwapRoute).find(
                key => SwapRoute[key] === currentRoute
              )} 􀆈`}
            </Text>
          </Inline>
        </ContextMenuButton>
      </Column>
    </Columns>
  );
}
