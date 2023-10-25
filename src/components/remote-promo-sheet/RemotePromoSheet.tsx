import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';

import { useNavigation } from '@/navigation/Navigation';
import { PromoSheet } from '@/components/PromoSheet';
import { useTheme } from '@/theme';
import { CampaignCheckResult } from './campaignChecks';
import { usePromoSheetQuery } from '@/resources/promoSheet/promoSheetQuery';
import { noop } from 'lodash';

const HEADER_HEIGHT = 285;
const HEADER_WIDTH = 390;

type RootStackParamList = {
  RemotePromoSheet: CampaignCheckResult;
};

export function RemotePromoSheet() {
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const { params } = useRoute<
    RouteProp<RootStackParamList, 'RemotePromoSheet'>
  >();
  const { campaignId, campaignKey } = params;

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
      items={items}
    />
  );
}
