import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { noop, get } from 'lodash';

import { useNavigation } from '@/navigation/Navigation';
import { PromoSheet } from '@/components/PromoSheet';
import { useTheme } from '@/theme';
import { CampaignCheckResult } from './checkForCampaign';
import { usePromoSheetQuery } from '@/resources/promoSheet/promoSheetQuery';
import { maybeSignUri } from '@/handlers/imgix';
import { campaigns } from '@/storage';
import { delay } from '@/utils/delay';

const DEFAULT_HEADER_HEIGHT = 285;
const DEFAULT_HEADER_WIDTH = 390;

type RootStackParamList = {
  RemotePromoSheet: CampaignCheckResult;
};

export function RemotePromoSheet() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();
  const { params } = useRoute<
    RouteProp<RootStackParamList, 'RemotePromoSheet'>
  >();
  const { campaignId, campaignKey } = params;

  useEffect(() => {
    return () => {
      campaigns.set(['isCurrentlyShown'], false);
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

  const internalNavigation = useCallback(() => {
    goBack();

    delay(300).then(() =>
      navigate(data?.promoSheet?.primaryButtonProps.route, {
        ...data?.promoSheet?.primaryButtonProps.route.options,
      })
    );
  }, [goBack, navigate, data?.promoSheet]);

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

  const backgroundSignedImageUrl = backgroundImage?.url
    ? maybeSignUri(backgroundImage.url)
    : undefined;

  const headerSignedImageUrl = headerImage?.url
    ? maybeSignUri(headerImage.url)
    : undefined;

  return (
    <PromoSheet
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      backgroundImage={{ uri: backgroundSignedImageUrl }}
      campaignKey={campaignKey}
      headerImage={{ uri: headerSignedImageUrl }}
      headerImageAspectRatio={
        headerImageAspectRatio ?? DEFAULT_HEADER_WIDTH / DEFAULT_HEADER_HEIGHT
      }
      sheetHandleColor={sheetHandleColor}
      header={header ?? ''}
      subHeader={subHeader ?? ''}
      primaryButtonProps={{
        ...primaryButtonProps,
        onPress: internalNavigation,
      }}
      secondaryButtonProps={{
        ...secondaryButtonProps,
        onPress: goBack,
      }}
      items={items.map((item: any) => {
        if (item.gradient) {
          if (item.gradient.includes('.')) {
            const gradient = get(colors, item.gradient);

            return {
              ...item,
              gradient,
            };
          }

          const gradient =
            (colors as { [key: string]: any }).gradients[item.gradient] ??
            undefined;

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
