import { analytics } from '@/analytics';
import { DynamicHeightSheet } from '@/components/sheet';
import { BackgroundProvider, Box } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import { useRewards } from '@/resources/rewards/rewardsQuery';
import { RewardsContent } from '@/screens/rewards/components/RewardsContent';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWalletsStore } from '@/state/wallets/wallets';

export const RewardsSheet: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const accountAddress = useWalletsStore(state => state.accountAddress);
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
      analytics.track(analytics.event.rewardsViewedSheet);
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
