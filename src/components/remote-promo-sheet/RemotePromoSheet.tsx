import React, { useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { noop, get } from 'lodash';
import { MMKV } from 'react-native-mmkv';

import { useNavigation } from '@/navigation/Navigation';
import { PromoSheet } from '@/components/PromoSheet';
import { useTheme } from '@/theme';
import { CampaignCheckResult } from './useRunCampaignChecks';
import { usePromoSheetQuery } from '@/resources/promoSheet/promoSheetQuery';
import { STORAGE_IDS } from '@/model/mmkv';

const HEADER_HEIGHT = 285;
const HEADER_WIDTH = 390;

type RootStackParamList = {
  RemotePromoSheet: CampaignCheckResult;
};

const mmkv = new MMKV();

export function RemotePromoSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute<
    RouteProp<RootStackParamList, 'RemotePromoSheet'>
  >();
  const { campaignId, campaignKey } = params;

  useEffect(() => {
    mmkv.set(STORAGE_IDS.PROMO_CURRENTLY_SHOWN, true);
    mmkv.set(STORAGE_IDS.LAST_PROMO_SHEET_TIMESTAMP, Date.now());

    return () => {
      mmkv.set(STORAGE_IDS.PROMO_CURRENTLY_SHOWN, false);
    };
  }, []);

  const { data, error } = usePromoSheetQuery(
    {
      id: campaignId,
    },
    {
      enabled: !!campaignId,
    }
  );

  if (!data?.promoSheet || error) {
    return null;
  }

  const {
    accentColor: accentColorString,
    backgroundColor: backgroundColorString,
    sheetHandleColor: sheetHandleColorString,
    backgroundImage,
    headerImage,
    headerImageAspectRatio,
    header,
    items,
    primaryButtonProps,
    secondaryButtonProps,
    subHeader,
  } = data.promoSheet;

  const accentColor =
    (colors as { [key: string]: any })[accentColorString as string] ??
    colors.whiteLabel;

  const backgroundColor =
    (colors as { [key: string]: any })[backgroundColorString as string] ??
    colors.trueBlack;

  const sheetHandleColor =
    (colors as { [key: string]: any })[sheetHandleColorString as string] ??
    colors.trueBlack;

  return (
    <PromoSheet
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      backgroundImage={backgroundImage?.url}
      campaignKey={campaignKey}
      headerImage={headerImage?.url}
      headerImageAspectRatio={
        headerImageAspectRatio ?? HEADER_HEIGHT / HEADER_WIDTH
      }
      sheetHandleColor={sheetHandleColor}
      header={header}
      subHeader={subHeader}
      primaryButtonProps={{
        ...primaryButtonProps,
        onPress: noop, // TODO: Primary action should be passed
      }}
      secondaryButtonProps={{
        ...secondaryButtonProps,
        onPress: goBack,
      }}
      items={items.map((item: any) => {
        if (item.gradient) {
          console.log(item.gradient);
          if (item.gradient.includes('.')) {
            const gradient = get(colors, item.gradient);

            return {
              ...item,
              gradient,
            };
          }

          const gradient = colors.gradients[item.gradient] ?? undefined;

          return {
            ...item,
            gradient,
          };
        }

        return item;
      })}
    />
  );
}
