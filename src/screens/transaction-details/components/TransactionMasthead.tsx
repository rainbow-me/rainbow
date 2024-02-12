import React, { useEffect, useState } from 'react';
import { NativeCurrencyKey, RainbowTransaction } from '@/entities';

import { Bleed, Box, Columns, Cover, Row, Rows, Separator, Stack, Text } from '@/design-system';

import styled from '@/styled-thing';
import { position } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { ImgixImage } from '@/components/images';
import RowWithMargins from '@/components/layout/RowWithMargins';
import { IS_ANDROID } from '@/env';
import { convertAmountAndPriceToNativeDisplay, convertAmountToBalanceDisplay } from '@/helpers/utilities';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { fetchReverseRecord } from '@/handlers/ens';

import { address } from '@/utils/abbreviations';
import { ContactAvatar } from '@/components/contacts';
import { profileUtils } from '@/utils';
import { profile } from 'console';
import { useENSResolver } from '@/hooks';

const TransactionMastheadHeight = android ? 153 : 135;

const Container = styled(Box).attrs({
  direction: 'column',
})({
  borderRadius: 30,
  flex: 1,
  paddingHorizontal: 20,
  height: TransactionMastheadHeight,
  overflow: 'hidden',
  zIndex: 0,
  ...(android ? { paddingTop: 4 } : {}),
  justifyContent: 'center',
  alitnItems: 'center',
});

const Gradient = styled(Box).attrs(({ theme: { colors }, color }: { theme: ThemeContextProps; color: string }) => ({
  backgroundColor: colors.alpha(color, 0.08),
}))({
  ...position.coverAsObject,
});

function CurrencyTile({
  contactAddress,
  title,
  subtitle,
  image,
  fallback,
}: {
  contactAddress?: string;
  title: string;
  subtitle: string;
  image: string;
  fallback?: string;
}) {
  const { colors } = useTheme();
  const colorForAsset =
    usePersistentDominantColorFromImage(image) ||
    colors.avatarColor[profileUtils.addressHashedColorIndex(contactAddress as string) as number] ||
    colors.appleBlue;
  const avatarColor = colors.avatarBackgrounds[profileUtils.addressHashedColorIndex(contactAddress as string) || 1];
  const colorToUse = title.includes('...') ? avatarColor : colorForAsset;
  return (
    <Container>
      <Gradient color={colorToUse} />

      <Rows alignHorizontal="center" alignVertical="center" space="10px">
        <Row height="content">
          {!title.includes('...') ? (
            <ImgixImage source={{ uri: image }} size={40} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <ContactAvatar color={colorToUse} size="medium" value={profileUtils.addressHashedEmoji(contactAddress as string)} />
          )}
        </Row>
        <Row height="content">
          <Box width="full">
            <Rows space={'10px'}>
              <Row height="content">
                <Text size="16px / 22px (Deprecated)" color="label" weight="bold" align="center" numberOfLines={1}>
                  {title}
                </Text>
              </Row>
              <Row height="content">
                <Box alignItems="center" justifyContent="center" marginTop={IS_ANDROID ? '-6px' : { custom: 0 }} width="full">
                  <Text size="14px / 19px (Deprecated)" color="labelSecondary" weight="semibold" align="center">
                    {subtitle}
                  </Text>
                </Box>
              </Row>
            </Rows>
          </Box>
        </Row>
      </Rows>
    </Container>
  );
}

const DoubleChevron = () => (
  <Cover alignHorizontal="center" alignVertical="center">
    <RowWithMargins margin={0}>
      <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
        􀯻
      </Text>
      <Bleed left="6px">
        <Text color="secondary40 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
          􀯻
        </Text>
      </Bleed>
    </RowWithMargins>
  </Cover>
);

export default function TransactionMasthead({
  transaction,
  nativeCurrency,
}: {
  transaction: RainbowTransaction;
  nativeCurrency: NativeCurrencyKey;
}) {
  const [leftTitle, setLeftTitle] = useState(address(transaction?.from || '', 6, 4));
  const [leftSubtitle, setLeftSubtitle] = useState('');
  const [rightTitle, setRightTitle] = useState(address(transaction?.to || '', 6, 4));
  const [rightSubtitle, setRightSubtitle] = useState('');
  const [rightImage, setRightImage] = useState(transaction?.asset?.icon_url || '');
  const [leftImage, setLeftImage] = useState(transaction?.asset?.icon_url || '');

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        if (['wrap', 'unwrap', 'swap'].includes(transaction?.type)) {
          const inAsset = transaction?.changes?.find(a => a?.direction === 'in')?.asset;
          const outAsset = transaction?.changes?.find(a => a?.direction === 'out')?.asset;

          if (inAsset && outAsset) {
            setLeftImage(outAsset?.icon_url || '');
            setRightImage(inAsset?.icon_url || '');
            const inAssetValueDisplay = convertAmountToBalanceDisplay(inAsset?.balance?.amount || '0', inAsset);
            const outAssetValueDisplay = convertAmountToBalanceDisplay(outAsset?.balance?.amount || '0', outAsset);
            const inAssetNativeDisplay = convertAmountAndPriceToNativeDisplay(
              inAsset?.balance?.amount || '0',
              inAsset?.price?.value || '0',
              nativeCurrency
            )?.display;
            const outAssetNativeDisplay = convertAmountAndPriceToNativeDisplay(
              outAsset?.balance?.amount || '0',
              outAsset?.price?.value || '0',
              nativeCurrency
            ).display;

            setLeftTitle(outAssetValueDisplay);
            setLeftSubtitle(outAssetNativeDisplay);
            setRightTitle(inAssetValueDisplay);
            setRightSubtitle(inAssetNativeDisplay);
            return;
          }
        }

        const fromEns = await fetchReverseRecord(transaction?.from || '');
        const toEns = await fetchReverseRecord(transaction?.to || '');

        if (fromEns) {
          setLeftSubtitle(leftTitle);
          setLeftTitle(fromEns);
          const fromAvatar = await fetchENSAvatar(fromEns);
          if (fromAvatar?.imageUrl) {
            setLeftImage(fromAvatar.imageUrl);
          }
        }
        if (transaction.type === 'contract_interaction' || transaction.type === 'approve') {
          if (transaction?.contract?.iconUrl) {
            setRightImage(transaction?.contract?.iconUrl);
          }
          if (transaction?.contract?.name) {
            setRightTitle(transaction?.contract?.name);
          }
        }

        if (toEns && transaction.type !== 'contract_interaction') {
          setRightSubtitle(rightTitle);
          setRightTitle(toEns);
          const toAvatar = await fetchENSAvatar(toEns);
          if (toAvatar?.imageUrl) {
            setRightImage(toAvatar.imageUrl);
          }
        }

        if (transaction.type === 'mint') {
          const tempTitle = rightTitle;
          const tempSubtitle = rightSubtitle;
          setRightTitle(leftTitle);
          setRightSubtitle(leftSubtitle);
          setLeftTitle(tempTitle);
          setLeftSubtitle(tempSubtitle);
        }
      } catch (error) {
        console.error('Failed to fetch transaction details:', error);
        // Handle errors or set fallback values as needed
      }
    };

    fetchAndSetData();
  }, []);

  return (
    <Stack space="19px (Deprecated)">
      <Separator color="divider40 (Deprecated)" thickness={2} />

      <Box alignItems="center" width={'full'}>
        <Columns space={{ custom: 9 }}>
          <CurrencyTile
            contactAddress={transaction?.from as string}
            title={leftTitle}
            subtitle={leftSubtitle}
            image={leftImage}
            fallback={transaction?.asset?.symbol}
          />

          <CurrencyTile
            contactAddress={transaction?.to as string}
            title={rightTitle}
            subtitle={rightSubtitle}
            image={rightImage}
            fallback={transaction?.asset?.symbol}
          />
        </Columns>

        <Box
          background="body (Deprecated)"
          borderRadius={16}
          height={{ custom: 32 }}
          shadow="21px light (Deprecated)"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            transform: [{ translateX: 0 }, { translateY: 50 }],
          }}
          width={{ custom: 32 }}
        >
          <DoubleChevron />
        </Box>
      </Box>
      <Separator color="divider40 (Deprecated)" thickness={2} />
    </Stack>
  );
}
