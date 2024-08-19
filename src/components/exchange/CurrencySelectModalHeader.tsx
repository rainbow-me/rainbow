import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { delayNext } from '../../hooks/useMagicAutofocus';
import { BackButton } from '../header';
import { SheetHandleFixedToTop } from '../sheet';
import { Box, Inset, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { ethereumUtils } from '@/utils';

export const CurrencySelectModalHeaderHeight = 59;

export default function CurrencySelectModalHeader({
  handleBackButton,
  showBackButton,
  showHandle,
  testID,
}: {
  handleBackButton: () => void;
  showBackButton: boolean;
  showHandle: boolean;
  testID: string;
}) {
  const { navigate, getState: dangerouslyGetState } = useNavigation();
  const {
    params: { defaultOutputAsset, title, showCoinIcon },
  } = useRoute<any>();
  const theme = useTheme();

  const handlePressBack = useCallback(() => {
    // @ts-expect-error – updating read-only property
    dangerouslyGetState().index = 1;
    delayNext();
    handleBackButton();
    navigate(Routes.MAIN_EXCHANGE_SCREEN);
  }, [dangerouslyGetState, handleBackButton, navigate]);

  return (
    <Box height={{ custom: CurrencySelectModalHeaderHeight }} justifyContent="center" alignItems="center" width="full" flexDirection="row">
      {/** @ts-expect-error JavaScript component */}
      {showHandle && <SheetHandleFixedToTop />}
      {showBackButton && (
        <Box position="absolute" bottom="0px" left="0px" top={{ custom: 3 }} justifyContent="center" alignItems="center">
          {/** @ts-expect-error JavaScript component */}
          <BackButton
            direction="left"
            height={CurrencySelectModalHeaderHeight}
            onPress={handlePressBack}
            testID={testID}
            textChevron={android}
            throttle
          />
        </Box>
      )}
      {showCoinIcon && (
        <Inset right="4px">
          <RainbowCoinIcon
            size={20}
            icon={defaultOutputAsset?.icon_url}
            chainId={ethereumUtils.getChainIdFromNetwork(defaultOutputAsset?.network)}
            colors={defaultOutputAsset?.colors}
            symbol={defaultOutputAsset?.symbol}
            theme={theme}
            ignoreBadge
          />
        </Inset>
      )}

      <Text color="primary (Deprecated)" size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1} align="center">
        {title}
      </Text>
    </Box>
  );
}
