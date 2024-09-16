import c from 'chroma-js';
import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { get } from 'lodash';

import { useNavigation } from '@/navigation/Navigation';
import { PromoSheet } from '@/components/PromoSheet';
import { useTheme } from '@/theme';
import { usePromoSheetQuery } from '@/resources/promoSheet/promoSheetQuery';
import { maybeSignUri } from '@/handlers/imgix';
import { delay } from '@/utils/delay';
import { Linking } from 'react-native';
import Routes from '@/navigation/routesNames';
import { Language } from '@/languages';
import { useAccountSettings } from '@/hooks';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';
import { RootStackParamList } from '@/navigation/types';
import { Colors } from '@/styles';
import { getHighContrastColor } from '@/__swaps__/utils/swaps';

const DEFAULT_HEADER_HEIGHT = 285;
const DEFAULT_HEADER_WIDTH = 390;

type Item = {
  title: Record<keyof Language, string>;
  description: Record<keyof Language, string>;
  icon: string;
  gradient?: string;
};

const enum ButtonType {
  Internal = 'Internal',
  External = 'External',
}

const getHexOrThemeColor = (colors: Colors, hexOrThemeString: string | null | undefined, fallbackColor: string) => {
  if (!hexOrThemeString) {
    return get(colors, fallbackColor);
  }

  if (c.valid(hexOrThemeString)) {
    return hexOrThemeString;
  }

  return get(colors, hexOrThemeString) ?? get(colors, fallbackColor);
};

const getKeyForLanguage = (key: string, promoSheet: any, language: Language) => {
  if (!promoSheet) {
    return '';
  }

  const objectOrPrimitive = get(promoSheet, key);
  if (typeof objectOrPrimitive === 'undefined') {
    return '';
  }

  if (objectOrPrimitive[language]) {
    return objectOrPrimitive[language];
  }

  return objectOrPrimitive[Language.EN_US] ?? '';
};

export function RemotePromoSheet() {
  const { colors, isDarkMode } = useTheme();
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RemotePromoSheet'>>();
  const { campaignId, campaignKey } = params;
  const { language } = useAccountSettings();

  useEffect(() => {
    return () => {
      remotePromoSheetsStore.setState({
        isShown: false,
      });
    };
  }, []);

  const { data } = usePromoSheetQuery(
    {
      id: campaignId,
    },
    {
      enabled: !!campaignId,
    }
  );

  const getButtonForType = (type: ButtonType) => {
    switch (type) {
      default:
      case ButtonType.Internal:
        return () => internalNavigation();
      case ButtonType.External:
        return () => externalNavigation();
    }
  };

  const externalNavigation = useCallback(() => {
    Linking.openURL(data?.promoSheet?.primaryButtonProps.props.url);
  }, [data?.promoSheet?.primaryButtonProps.props.url]);

  const internalNavigation = useCallback(() => {
    goBack();

    delay(300).then(() =>
      navigate((Routes as any)[data?.promoSheet?.primaryButtonProps.props.route], {
        ...(data?.promoSheet?.primaryButtonProps.props.options || {}),
      })
    );
  }, [goBack, navigate, data?.promoSheet]);

  if (!data?.promoSheet) {
    goBack();
    return null;
  }

  const {
    accentColor: accentColorString,
    backgroundColor: backgroundColorString,
    sheetHandleColor: sheetHandleColorString,
    backgroundImage,
    headerImage,
    headerImageAspectRatio,
    items,
    primaryButtonProps,
    secondaryButtonProps,
  } = data.promoSheet;

  const accentColor = getHexOrThemeColor(colors, accentColorString, 'appleBlue');
  const backgroundColor = getHexOrThemeColor(colors, backgroundColorString, 'white');
  const sheetHandleColor = getHexOrThemeColor(colors, sheetHandleColorString, 'whiteLabel');
  const primaryButtonBgColor = getHexOrThemeColor(colors, primaryButtonProps.color, 'appleBlue');
  const primaryButtonTextColor = getHexOrThemeColor(colors, primaryButtonProps.textColor, 'whiteLabel');
  const secondaryButtonBgColor = getHexOrThemeColor(colors, secondaryButtonProps.color, 'transparent');
  const secondaryButtonTextColor = getHexOrThemeColor(
    colors,
    secondaryButtonProps.textColor || getHighContrastColor(backgroundColor)[isDarkMode ? 'dark' : 'light'],
    'whiteLabel'
  );

  const backgroundSignedImageUrl = backgroundImage?.url ? maybeSignUri(backgroundImage.url) : undefined;
  const headerSignedImageUrl = headerImage?.url ? maybeSignUri(headerImage.url) : undefined;

  return (
    <PromoSheet
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      backgroundImage={backgroundSignedImageUrl ? { uri: backgroundSignedImageUrl } : undefined}
      campaignKey={campaignKey}
      headerImage={{ uri: headerSignedImageUrl }}
      headerImageAspectRatio={headerImageAspectRatio ?? DEFAULT_HEADER_WIDTH / DEFAULT_HEADER_HEIGHT}
      sheetHandleColor={sheetHandleColor}
      header={getKeyForLanguage('header', data.promoSheet, language as Language)}
      subHeader={getKeyForLanguage('subHeader', data.promoSheet, language as Language)}
      primaryButtonProps={{
        ...primaryButtonProps,
        color: primaryButtonBgColor,
        textColor: primaryButtonTextColor,
        label: getKeyForLanguage('primaryButtonProps.label', data.promoSheet, language as Language),
        onPress: getButtonForType(data.promoSheet.primaryButtonProps.type),
      }}
      secondaryButtonProps={{
        ...secondaryButtonProps,
        color: secondaryButtonBgColor,
        textColor: secondaryButtonTextColor,
        label: getKeyForLanguage('secondaryButtonProps.label', data.promoSheet, language as Language),
        onPress: goBack,
      }}
      items={items.map((item: Item) => {
        const title = getKeyForLanguage('title', item, language as Language);
        const description = getKeyForLanguage('description', item, language as Language);

        let gradient = undefined;
        if (item.gradient) {
          gradient = get(colors.gradients, item.gradient);
        }

        return {
          ...item,
          title,
          description,
          gradient,
        };
      })}
    />
  );
}
