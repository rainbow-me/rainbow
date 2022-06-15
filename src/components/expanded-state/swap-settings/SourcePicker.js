import lang from 'i18n-js';
import React, { useCallback } from 'react';
import RainbowExchange from '../../../assets/exchanges/both.png';
import OneInchExchange from '../../../assets/exchanges/oneinch.png';
import ZeroXExchange from '../../../assets/exchanges/zerox.png';
import { ContextMenuButton } from '../../context-menu';
import { Column, Columns, Inline, Text } from '@rainbow-me/design-system';

import { ImgixImage } from '@rainbow-me/images';
import { Source } from '@rainbow-me/redux/swap';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const sourceMenuItems = () => {
  return Object.values(Source).map(source => ({
    actionKey: source,
    actionTitle: lang.t(`exchange.source.${source}`),
    icon: {
      iconType: 'ASSET',
      iconValue: `${source}`,
    },
  }));
};

const androidSourceMenuItems = () => {
  return Object.values(Source).reduce(
    (obj, key) => ((obj[key] = lang.t(`exchange.source.${key}`)), obj),
    {}
  );
};

export default function SourcePicker({ onSelect, currentSource }) {
  const imageSource = useMemo(() => {
    let source = null;
    switch (currentSource) {
      case Source.Aggregator1inch:
        source = OneInchExchange;
        break;
      case Source.Aggregator0x:
        source = ZeroXExchange;
        break;
      default:
        source = RainbowExchange;
        break;
    }

    return source;
  }, [currentSource]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      onSelect(actionKey);
    },
    [onSelect]
  );
  const onPressAndroid = useCallback(() => {
    const menuOptions = Object.values(androidSourceMenuItems());
    showActionSheetWithOptions(
      {
        options: menuOptions,
        showSeparators: true,
      },
      idx => {
        if (idx !== undefined) {
          const menuOptionsKeys = Object.keys(androidSourceMenuItems());
          onSelect(menuOptionsKeys[idx]);
        }
      }
    );
  }, [onSelect]);

  return (
    <Columns alignHorizontal="justify" alignVertical="center">
      <Column>
        <Text size="18px" weight="bold">
          {lang.t('exchange.source_picker')}
        </Text>
      </Column>
      <Column width="content">
        <ContextMenuButton
          menuItems={sourceMenuItems()}
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
              {`${lang.t(`exchange.source.${currentSource}`)} 􀆈`}
            </Text>
          </Inline>
        </ContextMenuButton>
      </Column>
    </Columns>
  );
}
