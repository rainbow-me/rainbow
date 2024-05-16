import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Keyboard } from 'react-native';
import RainbowExchange from '../../../assets/exchanges/both.png';
import OneInchExchange from '../../../assets/exchanges/oneinch.png';
import ZeroXExchange from '../../../assets/exchanges/zerox.png';
import { ButtonPressAnimation } from '../../animations';
import { ContextMenuButton } from '../../context-menu';
import { Box, Column, Columns, Inline, Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation';
import { Source } from '@/raps/references';
import Routes from '@/navigation/routesNames';

import { showActionSheetWithOptions } from '@/utils';

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
  return Object.values(Source).reduce((obj, key) => ((obj[key] = lang.t(`exchange.source.${key}`)), obj), {});
};

export default function SourcePicker({ onSelect, currentSource }) {
  const { navigate } = useNavigation();
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

  const openRoutesExplainer = () => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'routeSwaps',
    });
  };

  return (
    <Columns alignHorizontal="justify" alignVertical="center">
      <Column width="content">
        <Box
          as={ButtonPressAnimation}
          {...(ios ? { marginVertical: '-12px' } : {})}
          // @ts-expect-error
          onPress={openRoutesExplainer}
          paddingVertical="12px"
          testID="swap-settings-routes-label"
          style={{ maxWidth: 200 }}
        >
          <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
            {lang.t('exchange.source_picker')}
            <Text color="secondary30 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
              {' 􀅵'}
            </Text>
          </Text>
        </Box>
      </Column>
      <Column width="content">
        <ContextMenuButton
          menuItems={sourceMenuItems()}
          menuTitle=""
          onPressAndroid={onPressAndroid}
          onPressMenuItem={handleOnPressMenuItem}
        >
          <Box
            background="body (Deprecated)"
            borderRadius={40}
            paddingHorizontal="10px"
            paddingVertical="6px"
            shadow="21px light (Deprecated)"
            // shadow clipped on android by ButtonPressAnimation.android.tsx inside <ContextMenuButton>
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
                size={30}
              />
              <Text
                color="primary (Deprecated)"
                size="18px / 27px (Deprecated)"
                testID={`swap-settings-routes-current-${currentSource}`}
                weight="bold"
              >
                {`${lang.t(`exchange.source.${currentSource}`)} 􀆈`}
              </Text>
            </Inline>
          </Box>
        </ContextMenuButton>
      </Column>
    </Columns>
  );
}
