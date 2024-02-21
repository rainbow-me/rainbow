import React, { useCallback, useEffect, useState } from 'react';
import { DynamicHeightSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RewardsContent } from '@/screens/rewards/components/RewardsContent';
import { IS_ANDROID } from '@/env';
import { StatusBar } from 'react-native';
import { useRewards } from '@/resources/rewards/rewardsQuery';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { useFocusEffect } from '@react-navigation/native';
import { analyticsV2 } from '@/analytics';

export const RewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const accountAddress = useSelector((state: AppState) => state.settings.accountAddress);
  const [isLoading, setIsLoading] = useState(true);
  const {
    data,
    isLoading: queryIsLoading,
    isLoadingError,
  } = useRewards({
    address: accountAddress,
  });

  // TODO: For now we are disabling using the asset price in native currency
  //  we will use the fallback which is price in USD provided by backend
  // const assetPriceInNativeCurrency = useMemo(() => {
  //   const assetCode = data?.rewards?.meta.token.asset.assetCode;
  //
  //   if (!assetCode) {
  //     return undefined;
  //   }
  //
  //   return ethereumUtils.getAssetPrice(assetCode);
  // }, [data?.rewards?.meta.token.asset]);

  useEffect(() => {
    setIsLoading(queryIsLoading);
  }, [queryIsLoading]);

  useFocusEffect(
    useCallback(() => {
      analyticsV2.track(analyticsV2.event.rewardsViewedSheet);
    }, [])
  );

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JS component
        <DynamicHeightSheet
          backgroundColor={backgroundColor}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          limitScrollViewContent
          // sheetHeightRatio={0.67}
          sheetHeight={568}
          contentHeight={height - top}
          scrollEnabled={false}
        >
          <Box width="full" height="full" padding="20px">
            <RewardsContent
              data={data}
              // TODO: For now we are disabling using the asset price in native currency
              assetPrice={undefined}
              isLoadingError={isLoadingError}
              isLoading={isLoading}
            />
          </Box>
        </DynamicHeightSheet>
      )}
    </BackgroundProvider>
  );
};
