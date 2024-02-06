import React, { useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { MarqueeList } from '../../list';
import { Box, Stack, Text } from '@/design-system';
import { ensRecordsQueryKey, useENSRecords } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation';
import { queryClient } from '@/react-query';
import Routes from '@/navigation/routesNames';
import { useEnsMarquee } from '@/resources/metadata/ensMarqueeQuery';
import { EnsMarqueeAccount } from '@/graphql/__generated__/metadata';
import { ensIntroMarqueeNames } from '@/references';

type MarqueeItemType = {
  account: EnsMarqueeAccount;
  name: string;
  onPress: () => void;
  testID?: string;
};

export const ensAvatarUrl = (ensName: string) => `https://metadata.ens.domains/mainnet/avatar/${ensName}?v=1.0`;

export const getEnsMarqueeFallback = (): EnsMarqueeAccount[] => {
  return ensIntroMarqueeNames.map(name => ({
    name,
    avatar: ensAvatarUrl(name),
    address: '',
  }));
};

const lineHeight = 30;
const estimateDescriptionProfilePreviewHeight = (description?: string) => {
  return description ? Math.ceil(description.length / 50) * lineHeight : 0;
};

export default function IntroMarquee({ isSmallPhone }: { isSmallPhone: boolean }) {
  const { navigate } = useNavigation();

  const { data, isLoading } = useEnsMarquee();

  const handlePressENS = useCallback(
    (ensName: string) => {
      const data = queryClient.getQueryData<ReturnType<typeof useENSRecords>['data']>(ensRecordsQueryKey({ name: ensName }));
      const description = data?.records?.description || '';
      navigate(Routes.PROFILE_PREVIEW_SHEET, {
        address: ensName,
        descriptionProfilePreviewHeight: estimateDescriptionProfilePreviewHeight(description),
        fromDiscover: true,
      });
    },
    [navigate]
  );

  const renderItem = useCallback(
    ({
      item,
      onPressStart,
      onPressCancel,
      testID,
    }: {
      item: MarqueeItemType;
      onPressStart: () => void;
      onPressCancel: () => void;
      testID?: string;
    }) => (
      <ENSAvatarPlaceholder
        account={item.account}
        onPress={item.onPress}
        onPressCancel={onPressCancel}
        onPressStart={onPressStart}
        testID={testID}
      />
    ),
    []
  );

  const items = useMemo(() => {
    if (isLoading) {
      return [];
    } else {
      const accounts = data?.ensMarquee?.accounts;
      return accounts?.map((account, index) => ({
        account,
        onPress: () => handlePressENS(account.name),
        testID: `ens-names-marquee-item-${index}`,
      }));
    }
  }, [data, handlePressENS, isLoading]);

  return (
    <Box height={{ custom: isSmallPhone ? 90 : 100 }}>
      <MarqueeList height={isSmallPhone ? 90 : 100} items={items} renderItem={renderItem} speed={-15} testID="ens-names-marquee" />
    </Box>
  );
}

function ENSAvatarPlaceholder({
  account,
  onPress,
  onPressCancel,
  onPressStart,
  testID,
}: {
  account: EnsMarqueeAccount;
  onPress: () => void;
  onPressCancel: () => void;
  onPressStart: () => void;
  testID?: string;
}) {
  return (
    <ButtonPressAnimation
      onCancel={({ nativeEvent: { state, close } }: any) => {
        // Ensure the press has been triggered
        if (state === 5 && close) {
          ReactNativeHapticFeedback.trigger('selection');
          onPress();
        }
      }}
      onPress={onPress}
      onPressCancel={onPressCancel}
      onPressStart={onPressStart}
      reanimatedButton={false}
      scaleTo={0.8}
      testID={testID}
    >
      <Box paddingHorizontal="12px">
        <Stack alignHorizontal="center" space={{ custom: 13 }}>
          <Box
            as={ImgixImage}
            background="body (Deprecated)"
            borderRadius={80}
            height={{ custom: 80 }}
            shadow="15px light (Deprecated)"
            source={{ uri: account.avatar }}
            width={{ custom: 80 }}
            size={100}
          />
          <Text align="center" color="secondary50 (Deprecated)" size="12px / 14px (Deprecated)" weight="semibold">
            {account.name}
          </Text>
        </Stack>
      </Box>
    </ButtonPressAnimation>
  );
}
