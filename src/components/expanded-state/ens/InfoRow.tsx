import React, { Fragment, useCallback, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { useNavigation } from '../../../navigation/Navigation';
import { useTheme } from '../../../theme/ThemeContext';
import { ShimmerAnimation } from '../../animations';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Icon } from '../../icons';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import { useAccountSettings, useOpenENSNFTHandler } from '@/hooks';
import { Bleed, Box, Inline, Inset, Text, useForegroundColor } from '@/design-system';
import { ImgixImage } from '@/components/images';
import Routes from '@/navigation/routesNames';
import { useENSAddress } from '@/resources/ens/ensAddressQuery';
import { CardSize } from '@/components/unique-token/CardSize';
import { useLegacyNFTs } from '@/resources/nfts';

export function InfoRowSkeleton() {
  const { colors } = useTheme();
  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box
        style={{
          backgroundColor: colors.alpha(colors.blueGreyDark, 0.04),
          borderRadius: 12,
          height: 24,
          overflow: 'hidden',
          width: 100,
        }}
      >
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          enabled
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06) as any}
          width={100}
        />
      </Box>
      <Box
        style={{
          backgroundColor: colors.alpha(colors.blueGreyDark, 0.04),
          borderRadius: 12,
          height: 24,
          overflow: 'hidden',
          width: 150,
        }}
      >
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          enabled
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06) as any}
          width={150}
        />
      </Box>
    </Inline>
  );
}

export default function InfoRow({
  ensName,
  explainSheetType,
  icon = undefined,
  isImage = false,
  label,
  url,
  wrapValue = children => children,
  value = undefined,
  switchValue,
  switchDisabled,
  useAccentColor,
  onSwitchChange,
}: {
  ensName?: string;
  explainSheetType?: string;
  icon?: string;
  isImage?: boolean;
  label: string;
  url?: string;
  wrapValue?: (children: React.ReactNode) => React.ReactNode;
  value?: string;
  switchValue?: boolean;
  switchDisabled?: boolean;
  useAccentColor?: boolean;
  onSwitchChange?: () => void;
}) {
  const { colors } = useTheme();
  const accentColor = useForegroundColor('accent');

  const [show, setShow] = useState(isImage);
  const [isMultiline, setIsMultiline] = useState(false);
  const isSwitch = switchValue !== undefined;

  const { navigate } = useNavigation();
  const handlePressExplain = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, { type: explainSheetType });
  }, [explainSheetType, navigate]);

  const explainer = explainSheetType ? (
    <ButtonPressAnimation onPress={handlePressExplain}>
      <Text color="secondary25 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
        􀅵
      </Text>
    </ButtonPressAnimation>
  ) : null;

  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box style={{ minWidth: 60, opacity: show ? 1 : 0 }}>
        <Inset top={isMultiline ? '15px (Deprecated)' : '10px'}>
          <Inline space="4px">
            <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
              {label}
              {android && <Fragment> {explainer}</Fragment>}
            </Text>
            {ios && explainer}
          </Inline>
        </Inset>
      </Box>
      {wrapValue(
        isImage ? (
          <ImageValue ensName={ensName} url={url} value={value} />
        ) : (
          <Box
            borderRadius={16}
            flexShrink={1}
            onLayout={({
              nativeEvent: {
                layout: { height },
              },
            }) => {
              setIsMultiline(height > 40);
              setShow(true);
            }}
            padding={isSwitch ? undefined : isMultiline ? ('15px (Deprecated)' as const) : ('10px' as const)}
            style={{
              backgroundColor: isSwitch ? 'transparent' : useAccentColor ? accentColor + '10' : 'rgba(255, 255, 255, 0.08)',
              maxWidth: android ? 250 : undefined,
              opacity: show ? 1 : 0,
            }}
          >
            <Inline alignVertical="center" space="6px">
              {icon ? (
                <Bleed vertical="6px">
                  <Icon color={colors.whiteLabel} height="18" name={icon} width="18" />
                </Bleed>
              ) : null}
              {value ? (
                <Text
                  align={isMultiline ? 'left' : 'center'}
                  color={useAccentColor ? 'accent' : 'primary (Deprecated)'}
                  containsEmoji
                  size="16px / 22px (Deprecated)"
                  weight={isMultiline ? 'semibold' : 'bold'}
                >
                  {value}
                </Text>
              ) : null}
              {isSwitch && (
                <Switch
                  disabled={switchDisabled || switchValue}
                  onValueChange={onSwitchChange}
                  testID="ens-reverse-record-switch"
                  trackColor={{
                    false: android ? colors.lightGrey : colors.white,
                    true: accentColor,
                  }}
                  value={switchValue}
                />
              )}
            </Inline>
          </Box>
        )
      )}
    </Inline>
  );
}

function ImageValue({ ensName, url, value }: { ensName?: string; url?: string; value?: string }) {
  const { accountAddress } = useAccountSettings();

  const { data: address } = useENSAddress({ name: ensName || '' });

  const {
    data: { nfts: uniqueTokensAccount },
  } = useLegacyNFTs({
    address: accountAddress,
  });
  const {
    data: { nfts: uniqueTokensProfile },
  } = useLegacyNFTs({
    address: address ?? '',
  });
  const isSelf = address === accountAddress;
  const uniqueTokens = isSelf ? uniqueTokensAccount : uniqueTokensProfile;

  const { onPress } = useOpenENSNFTHandler({ uniqueTokens, value });
  const enableZoomOnPress = !onPress;

  if (!url) return null;
  return (
    <ImagePreviewOverlayTarget aspectRatioType="cover" enableZoomOnPress={ios && enableZoomOnPress} imageUrl={url} onPress={onPress}>
      <Box as={ImgixImage} height="full" source={{ uri: url }} size={CardSize} />
    </ImagePreviewOverlayTarget>
  );
}
