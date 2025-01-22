import React, { useState } from 'react';
import * as i18n from '@/languages';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Box, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';

import { abbreviations, ethereumUtils } from '@/utils';
import { TransactionSimulationMeta } from '@/graphql/__generated__/metadataPOST';
import { ChainId } from '@/state/backendNetworks/types';

import { TransactionDetailsRow } from '@/components/Transactions/TransactionDetailsRow';
import { FadedScrollCard } from '@/components/FadedScrollCard';
import { IconContainer } from '@/components/Transactions/TransactionIcons';
import { formatDate } from '@/utils/formatDate';
import {
  COLLAPSED_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
  CARD_ROW_HEIGHT,
  CARD_BORDER_WIDTH,
  EXPANDED_CARD_TOP_INSET,
} from '@/components/Transactions/constants';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

interface TransactionDetailsCardProps {
  chainId: ChainId;
  expandedCardBottomInset: number;
  isBalanceEnough: boolean | undefined;
  isLoading: boolean;
  meta: TransactionSimulationMeta | undefined;
  methodName: string;
  noChanges: boolean;
  nonce: string | undefined;
  toAddress: string;
}

export const TransactionDetailsCard = ({
  chainId,
  expandedCardBottomInset,
  isBalanceEnough,
  isLoading,
  meta,
  methodName,
  noChanges,
  nonce,
  toAddress,
}: TransactionDetailsCardProps) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2);
  const [isExpanded, setIsExpanded] = useState(false);

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  const collapsedTextColor: TextColor = isLoading ? 'labelQuaternary' : 'blue';

  const showFunctionRow = meta?.to?.function || (methodName && methodName.substring(0, 2) !== '0x');
  const isContract = showFunctionRow || meta?.to?.created || meta?.to?.sourceCodeStatus;
  const showTransferToRow = !!meta?.transferTo?.address;
  // Hide DetailsCard if balance is insufficient once loaded
  if (!isLoading && isBalanceEnough === false) {
    return <></>;
  }
  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      isExpanded={isExpanded || noChanges}
      onPressCollapsedCard={isLoading ? undefined : () => setIsExpanded(true)}
    >
      <Stack space="24px">
        <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }} width="full">
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Text align="center" color={isExpanded || noChanges ? 'label' : collapsedTextColor} size="icon 15px" weight="bold">
                􁙠
              </Text>
            </IconContainer>
            <Text color={isExpanded || noChanges ? 'label' : collapsedTextColor} size="17pt" weight="bold">
              {i18n.t(i18n.l.walletconnect.simulation.details_card.title)}
            </Text>
          </Inline>
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="24px">
            <TransactionDetailsRow
              chainId={chainId}
              detailType="chain"
              value={useBackendNetworksStore.getState().getChainsLabel()[chainId]}
            />
            {!!(meta?.to?.address || toAddress || showTransferToRow) && (
              <TransactionDetailsRow
                detailType={isContract ? 'contract' : 'to'}
                onPress={() =>
                  ethereumUtils.openAddressInBlockExplorer({
                    address: meta?.to?.address || toAddress || meta?.transferTo?.address || '',
                    chainId,
                  })
                }
                value={
                  meta?.to?.name ||
                  abbreviations.address(meta?.to?.address || toAddress, 4, 6) ||
                  meta?.to?.address ||
                  toAddress ||
                  meta?.transferTo?.address ||
                  ''
                }
              />
            )}
            {showFunctionRow && <TransactionDetailsRow detailType="function" value={methodName} />}
            {!!meta?.to?.sourceCodeStatus && <TransactionDetailsRow detailType="sourceCodeVerification" value={meta.to.sourceCodeStatus} />}
            {!!meta?.to?.created && <TransactionDetailsRow detailType="dateCreated" value={formatDate(meta?.to?.created)} />}
            {nonce && <TransactionDetailsRow detailType="nonce" value={nonce} />}
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};
