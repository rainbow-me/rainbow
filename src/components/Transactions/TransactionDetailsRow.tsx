import React from 'react';
import * as i18n from '@/languages';
import { TouchableWithoutFeedback } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Box, Inline, Text } from '@/design-system';

import { DetailIcon, DetailBadge, IconContainer } from '@/components/Transactions/TransactionIcons';
import { SMALL_CARD_ROW_HEIGHT } from '@/components/Transactions/constants';
import { DetailType, DetailInfo } from '@/components/Transactions/types';
import { ChainId } from '@/state/backendNetworks/types';

interface TransactionDetailsRowProps {
  chainId?: ChainId;
  detailType: DetailType;
  onPress?: () => void;
  value: string;
}

export const TransactionDetailsRow = ({ chainId, detailType, onPress, value }: TransactionDetailsRowProps) => {
  const detailInfo: DetailInfo = infoForDetailType[detailType];

  return (
    <Box justifyContent="center" height={{ custom: SMALL_CARD_ROW_HEIGHT }}>
      <Inline alignHorizontal="justify" alignVertical="center" space="12px" wrap={false}>
        <Inline alignVertical="center" space="12px" wrap={false}>
          <DetailIcon detailInfo={detailInfo} />
          <Text color="labelTertiary" size="15pt" weight="semibold">
            {detailInfo.label}
          </Text>
        </Inline>
        <Inline alignVertical="center" space="6px" wrap={false}>
          {detailType === 'function' && <DetailBadge type="function" value={value} />}
          {detailType === 'sourceCodeVerification' && (
            <DetailBadge type={value === 'VERIFIED' ? 'verified' : value === 'UNVERIFIED' ? 'unverified' : 'unknown'} value={value} />
          )}
          {detailType === 'chain' && chainId && <ChainImage size={12} chainId={chainId} position="relative" />}
          {detailType !== 'function' && detailType !== 'sourceCodeVerification' && (
            <Text align="right" color="labelTertiary" numberOfLines={1} size="15pt" weight="semibold">
              {value}
            </Text>
          )}
          {(detailType === 'contract' || detailType === 'to') && (
            <TouchableWithoutFeedback>
              <ButtonPressAnimation onPress={onPress}>
                <IconContainer hitSlop={14} size={16}>
                  <Text align="center" color="labelQuaternary" size="icon 15px" weight="semibold">
                    􀂄
                  </Text>
                </IconContainer>
              </ButtonPressAnimation>
            </TouchableWithoutFeedback>
          )}
        </Inline>
      </Inline>
    </Box>
  );
};

const infoForDetailType: { [key: string]: DetailInfo } = {
  chain: {
    icon: '􀤆',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.chain),
  },
  contract: {
    icon: '􀉆',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.contract),
  },
  to: {
    icon: '􀉩',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.to),
  },
  function: {
    icon: '􀡅',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.function),
  },
  sourceCodeVerification: {
    icon: '􀕹',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.source_code),
  },
  dateCreated: {
    icon: '􀉉',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.contract_created),
  },
  nonce: {
    icon: '􀆃',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.nonce),
  },
};
