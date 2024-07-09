// @refresh reset

import React, { useEffect, useMemo, useState } from 'react';
import { ParsedAddressAsset, RainbowTransaction } from '@/entities';

import { Bleed, Box, Columns, Cover, Row, Rows, Separator, Stack, Text, TextProps } from '@/design-system';

import styled from '@/styled-thing';
import { position } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import RowWithMargins from '@/components/layout/RowWithMargins';
import { IS_ANDROID } from '@/env';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { fetchENSAvatar } from '@/hooks/useENSAvatar';
import { fetchReverseRecord } from '@/handlers/ens';

import { formatAddressForDisplay } from '@/utils/abbreviations';
import { ContactAvatar } from '@/components/contacts';
import { isLowerCaseMatch } from '@/utils';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { useContacts, useUserAccounts } from '@/hooks';
import { useTiming } from 'react-native-redash';
import Animated, { Easing, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Network } from '@/networks/types';
import * as lang from '@/languages';
import { checkForPendingSwap } from '../helpers/checkForPendingSwap';

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
  address = '',
  asset,
  showAsset,
  image,
  fallback,
  onAddressCopied,
}: {
  asset?: ParsedAddressAsset;
  showAsset?: boolean;
  contactAddress?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  fallback?: string;
  address?: string;
  onAddressCopied: () => void;
}) {
  const accountAddress = useSelector((state: AppState) => state.settings.accountAddress);
  const theme = useTheme();

  const { contacts } = useContacts();

  const { userAccounts, watchedAccounts } = useUserAccounts();
  const addressContact = address ? contacts[address] : undefined;
  const addressAccount = useMemo(() => {
    if (!address) {
      return undefined;
    } else {
      return (
        userAccounts.find(account => isLowerCaseMatch(account.address, address)) ??
        watchedAccounts.find(account => isLowerCaseMatch(account.address, address))
      );
    }
  }, [address, userAccounts, watchedAccounts]);

  const formattedAddress = formatAddressForDisplay(address, 4, 6);
  const [fetchedEnsName, setFetchedEnsName] = useState<string | undefined>();
  const [fetchedEnsImage, setFetchedEnsImage] = useState<string | undefined>();
  const [imageLoaded, setImageLoaded] = useState(!!addressAccount?.image);

  const accountEmoji = useMemo(() => returnStringFirstEmoji(addressAccount?.label), [addressAccount]);
  const accountName = useMemo(() => removeFirstEmojiFromString(addressAccount?.label), [addressAccount?.label]);
  const avatarColor =
    addressAccount?.color ?? addressContact?.color ?? theme.colors.avatarBackgrounds[addressHashedColorIndex(address) || 1];
  const emoji = accountEmoji || addressHashedEmoji(address);

  const name = accountName || fetchedEnsName || addressContact?.nickname || addressContact?.ens || formattedAddress;

  if (accountAddress?.toLowerCase() === address?.toLowerCase() && !showAsset) {
    title = lang.t(lang.l.transaction_details.you);
  }

  const shouldShowAddress = (!name.includes('...') || name === lang.t(lang.l.transaction_details.you)) && !showAsset;
  const imageUrl = fetchedEnsImage ?? addressAccount?.image;
  const ensAvatarSharedValue = useTiming(!!image || (!!imageUrl && imageLoaded), {
    duration: image || addressAccount?.image ? 0 : 420,
  });

  useEffect(() => {
    if (!addressContact?.nickname && !accountName) {
      fetchReverseRecord(address).then(name => {
        if (name) {
          setFetchedEnsName(name);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!addressAccount?.image && (fetchedEnsName || addressContact?.ens)) {
      const ens = fetchedEnsName ?? addressContact?.ens;
      if (ens) {
        fetchENSAvatar(ens, { cacheFirst: true }).then(avatar => {
          if (avatar?.imageUrl) {
            setFetchedEnsImage(avatar.imageUrl);
          }
        });
      }
    }
  }, [addressAccount?.image, addressContact?.ens, fetchedEnsName]);

  const colorForAsset = usePersistentDominantColorFromImage(showAsset ? asset?.icon_url : imageUrl) || avatarColor;

  const colorToUse = colorForAsset;

  const emojiAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ensAvatarSharedValue.value, [0, 1], [1, 0]),
  }));
  const ensAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ensAvatarSharedValue.value,
  }));

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Container>
      <Gradient color={colorToUse} />

      <Rows alignHorizontal="center" alignVertical="center" space="10px">
        <Row height="content">
          <Box>
            {showAsset ? (
              <RainbowCoinIcon
                size={40}
                icon={asset?.icon_url}
                network={asset?.network || Network.mainnet}
                symbol={asset?.symbol || ''}
                theme={theme}
                colors={asset?.colors}
              />
            ) : (
              <>
                <Animated.View style={ensAvatarAnimatedStyle}>
                  {/* add coin icon*/}
                  <ImageAvatar
                    image={image || imageUrl}
                    size="medium"
                    // @ts-expect-error JS component
                    onLoad={onImageLoad}
                  />
                </Animated.View>
                <Cover>
                  <Animated.View style={emojiAvatarAnimatedStyle}>
                    <ContactAvatar color={colorToUse} size="medium" value={emoji} />
                  </Animated.View>
                </Cover>
              </>
            )}
          </Box>
        </Row>
        <Row height="content">
          <Box width="full">
            <Rows space={'10px'}>
              <Row height="content">
                <Box alignItems="center" justifyContent="center" marginTop={IS_ANDROID ? '-6px' : { custom: 0 }} width="full">
                  <AnimatedText
                    size="16px / 22px (Deprecated)"
                    color="label"
                    weight="semibold"
                    align="center"
                    text={title || name}
                    loadedText={title || fetchedEnsName}
                  />
                </Box>
              </Row>
              <Row height="content">
                <Box alignItems="center" justifyContent="center" marginTop={IS_ANDROID ? '-6px' : { custom: 0 }} width="full">
                  <AnimatedText
                    size="14px / 19px (Deprecated)"
                    color="labelSecondary"
                    weight="semibold"
                    align="center"
                    text={shouldShowAddress ? formattedAddress : subtitle || ''}
                    loadedText={shouldShowAddress ? formattedAddress : subtitle}
                  />
                </Box>
              </Row>
            </Rows>
          </Box>
        </Row>
      </Rows>
    </Container>
  );
}

type AnimatedTextProps = Omit<TextProps, 'children'> & {
  text: string;
  loadedText: string | undefined;
};
const AnimatedText = ({ text, loadedText, size, weight, color, align, ...props }: AnimatedTextProps) => {
  const loadedTextValue = useTiming(!!loadedText, {
    duration: 420,
    easing: Easing.linear,
  });
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(loadedTextValue.value, [0, 0.5, 1], [1, 0, 0]),
  }));
  const loadedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(loadedTextValue.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  return (
    <Box>
      <Animated.View style={textStyle}>
        <Text color={color} size={size} weight={weight} align={align} numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>
      <Cover>
        <Animated.View style={loadedTextStyle}>
          <Text color={color} size={size} weight={weight} align={align} numberOfLines={1}>
            {loadedText}
          </Text>
        </Animated.View>
      </Cover>
    </Box>
  );
};
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

export default function TransactionMasthead({ transaction }: { transaction: RainbowTransaction }) {
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);

  const isPendingSwap = checkForPendingSwap(transaction);

  const inputAsset = useMemo(() => {
    const change = transaction?.changes?.find(a => a?.direction === 'in');

    if (!change?.asset) return undefined;

    // NOTE: For pending transactions let's use the change value
    // since the balance hasn't been updated yet.
    if (isPendingSwap) {
      const inAssetValueDisplay = `${handleSignificantDecimals(convertRawAmountToDecimalFormat(change?.value?.toString() || '0', change?.asset.decimals || 18), change?.asset.decimals || 18)} ${change?.asset.symbol}`;
      return {
        inAssetValueDisplay,
        inAssetNativeDisplay: change?.asset.price?.value
          ? convertAmountAndPriceToNativeDisplay(
              convertRawAmountToDecimalFormat(change?.value?.toString() || '0', change?.asset.decimals || 18),
              change?.asset.price?.value || '0',
              nativeCurrency
            )?.display
          : '-',
        ...change.asset,
      };
    }

    const inAsset = change.asset;

    return {
      inAssetValueDisplay: convertAmountToBalanceDisplay(inAsset?.balance?.amount || '0', inAsset),
      inAssetNativeDisplay: inAsset?.price?.value
        ? convertAmountAndPriceToNativeDisplay(inAsset?.balance?.amount || '0', inAsset?.price?.value || '0', nativeCurrency)?.display
        : '-',
      ...inAsset,
    };
  }, [isPendingSwap, nativeCurrency, transaction?.changes]);

  const outputAsset = useMemo(() => {
    const change = transaction?.changes?.find(a => a?.direction === 'out');

    if (!change?.asset) return undefined;

    // NOTE: For pending transactions let's use the change value
    // since the balance hasn't been updated yet.
    if (isPendingSwap) {
      const inAssetValueDisplay = `${handleSignificantDecimals(convertRawAmountToDecimalFormat(change?.value?.toString() || '0', change?.asset.decimals || 18), change?.asset.decimals || 18)} ${change?.asset.symbol}`;
      return {
        inAssetValueDisplay,
        inAssetNativeDisplay: change?.asset.price?.value
          ? convertAmountAndPriceToNativeDisplay(
              convertRawAmountToDecimalFormat(change?.value?.toString() || '0', change?.asset.decimals || 18),
              change?.asset.price?.value || '0',
              nativeCurrency
            )?.display
          : '-',
        ...change?.asset,
      };
    }

    const outAsset = change.asset;

    return {
      image: outAsset?.icon_url || '',
      inAssetValueDisplay: convertAmountToBalanceDisplay(outAsset?.balance?.amount || '0', outAsset),
      inAssetNativeDisplay: outAsset?.price?.value
        ? convertAmountAndPriceToNativeDisplay(outAsset?.balance?.amount || '0', outAsset?.price?.value || '0', nativeCurrency)?.display
        : '-',
      ...outAsset,
    };
  }, [isPendingSwap, nativeCurrency, transaction?.changes]);

  const contractImage = transaction?.contract?.iconUrl;
  const contractName = transaction?.contract?.name;

  // if its a mint then we want to show the mint contract first
  const toAddress = (transaction.type === 'mint' ? transaction?.from : transaction?.to) || undefined;
  const fromAddress = (transaction.type === 'mint' ? transaction?.to : transaction?.from) || undefined;

  const getRightMasteadData = (): { title?: string; subtitle?: string; image?: string } => {
    if (transaction.type === 'swap') {
      return {
        title: inputAsset?.inAssetValueDisplay,
        subtitle: inputAsset?.inAssetNativeDisplay,
      };
    }
    if (transaction.type === 'contract_interaction' || transaction.type === 'approve') {
      return {
        title: contractName,
        subtitle: transaction?.from || '',
        image: contractImage,
      };
    }

    return {
      title: undefined,
      subtitle: undefined,
      image: undefined,
    };
  };

  const getLeftMasteadData = (): { title?: string; subtitle?: string; image?: string } => {
    if (transaction.type === 'swap') {
      return {
        title: outputAsset?.inAssetValueDisplay,
        subtitle: outputAsset?.inAssetNativeDisplay,
      };
    }
    return {
      title: undefined,
      subtitle: undefined,
      image: undefined,
    };
  };

  const leftMasteadData = getLeftMasteadData();
  const rightMasteadData = getRightMasteadData();

  return (
    <Stack space="19px (Deprecated)">
      <Separator color="divider40 (Deprecated)" thickness={2} />

      <Box alignItems="center" width={'full'}>
        <Columns space={{ custom: 9 }}>
          <CurrencyTile
            address={fromAddress}
            title={leftMasteadData?.title}
            subtitle={leftMasteadData?.subtitle}
            image={leftMasteadData?.image}
            asset={outputAsset}
            showAsset={transaction.type === 'swap' || transaction.type === 'bridge'}
            fallback={transaction?.asset?.symbol}
            onAddressCopied={() => {}}
          />

          <CurrencyTile
            address={toAddress}
            asset={inputAsset}
            showAsset={transaction.type === 'swap' || transaction.type === 'bridge'}
            title={rightMasteadData?.title}
            subtitle={rightMasteadData?.subtitle}
            image={rightMasteadData?.image}
            fallback={transaction?.asset?.symbol}
            onAddressCopied={() => {}}
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
