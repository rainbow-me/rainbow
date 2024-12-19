import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { Image, PixelRatio } from 'react-native';

import { Bleed, Box, Inline, Text } from '@/design-system';

import { TransactionAssetType, TransactionSimulationAsset } from '@/graphql/__generated__/metadataPOST';
import { Network } from '@/state/backendNetworks/types';
import { convertAmountToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';

import { useAccountSettings } from '@/hooks';

import { maybeSignUri } from '@/handlers/imgix';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { EventInfo, EventType } from '@/components/Transactions/types';
import { infoForEventType, CARD_ROW_HEIGHT } from '@/components/Transactions/constants';
import { EventIcon } from '@/components/Transactions/TransactionIcons';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type TransactionSimulatedEventRowProps = {
  amount: string | 'unlimited';
  asset: TransactionSimulationAsset | undefined;
  eventType: EventType;
  price?: number | undefined;
};

export const TransactionSimulatedEventRow = ({ amount, asset, eventType, price }: TransactionSimulatedEventRowProps) => {
  const { nativeCurrency } = useAccountSettings();

  const chainId = useBackendNetworksStore.getState().getChainsIdByName()[asset?.network as Network];

  const { data: externalAsset } = useExternalToken({
    address: asset?.assetCode || '',
    chainId,
    currency: nativeCurrency,
  });

  const eventInfo: EventInfo = infoForEventType[eventType];

  const formattedAmount = useMemo(() => {
    if (!asset) return;

    const nftFallbackSymbol = parseFloat(amount) > 1 ? 'NFTs' : 'NFT';
    const assetDisplayName =
      asset?.type === TransactionAssetType.Nft ? asset?.name || asset?.symbol || nftFallbackSymbol : asset?.symbol || asset?.name;
    const shortenedDisplayName = assetDisplayName.length > 12 ? `${assetDisplayName.slice(0, 12).trim()}…` : assetDisplayName;

    const displayAmount =
      asset?.decimals === 0
        ? `${amount}${shortenedDisplayName ? ' ' + shortenedDisplayName : ''}`
        : convertRawAmountToBalance(amount, { decimals: asset?.decimals || 18, symbol: shortenedDisplayName }, 3, true).display;

    const unlimitedApproval = `${i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.unlimited)} ${asset?.symbol}`;

    return `${eventInfo.amountPrefix}${amount === 'UNLIMITED' ? unlimitedApproval : displayAmount}`;
  }, [amount, asset, eventInfo?.amountPrefix]);

  const url = maybeSignUri(asset?.iconURL, {
    fm: 'png',
    w: 16 * PixelRatio.get(),
  });

  const showUSD = (eventType === 'send' || eventType === 'receive') && !!price;

  const formattedPrice = price && convertAmountToNativeDisplay(price, nativeCurrency);

  return (
    <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }} width="full">
      <Inline alignHorizontal="justify" alignVertical="center" space="20px" wrap={false}>
        <Inline alignVertical="center" space="12px" wrap={false}>
          <EventIcon eventType={eventType} />
          <Inline alignVertical="bottom" space="6px" wrap={false}>
            <Text color="label" size="17pt" weight="bold">
              {eventInfo.label}
            </Text>
            {showUSD && (
              <Text color="labelQuaternary" size="13pt" weight="bold">
                {formattedPrice}
              </Text>
            )}
          </Inline>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
          <Bleed vertical="6px">
            {asset?.type !== TransactionAssetType.Nft ? (
              <RainbowCoinIcon
                size={16}
                icon={externalAsset?.icon_url}
                chainId={chainId}
                symbol={externalAsset?.symbol || ''}
                color={externalAsset?.colors?.primary || externalAsset?.colors?.fallback || undefined}
                showBadge={false}
              />
            ) : (
              <Image source={{ uri: url }} style={{ borderRadius: 4.5, height: 16, width: 16 }} />
            )}
          </Bleed>
          <Text align="right" color={eventInfo.textColor} numberOfLines={1} size="17pt" weight="bold">
            {formattedAmount}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
};
