import React from 'react';
import {
  RatioComponent,
  RatioOrderStatus,
} from '@ratio.me/ratio-react-native-library';
import { gretch } from 'gretchen';
import { nanoid } from 'nanoid/non-secure';
import { Wallet } from '@ethersproject/wallet';
import { useDispatch } from 'react-redux';

import { IS_IOS } from '@/env';
import { Box, Text, Inline, useForegroundColor } from '@/design-system';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import { Ratio as RatioLogo } from '@/components/icons/svg/Ratio';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';
import { analyticsV2 } from '@/analytics';
import {
  AssetType,
  NewTransactionOrAddCashTransaction,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import { ethereumUtils } from '@/utils';
import { AddCashCurrencies, ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { dataAddNewTransaction } from '@/redux/data';
import { FiatProviderName } from '@/entities/f2c';
import { Network } from '@/helpers';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { CoinIcon } from '@/components/coin-icon';

export function ratioOrderToNewTransaction(
  order: RatioOrderStatus,
  extra: {
    userId: string;
    analyticsSessionId: string;
  }
): NewTransactionOrAddCashTransaction {
  const { data } = order;
  const destAssetAddress = AddCashCurrencies['mainnet']?.[
    data.crypto.currency
  ]?.toLowerCase();

  if (!destAssetAddress) {
    throw new RainbowError(`Ratio: could not determine asset address`);
  }

  // TODO if account doesn't have this token, we fail here I.e. new wallets
  const asset = ethereumUtils.getAccountAsset(destAssetAddress);

  if (!asset) {
    throw new RainbowError(`Ratio: could not get account asset`);
  }

  return {
    amount: data.crypto.amount,
    asset,
    from: null,
    hash: null,
    nonce: null,
    sourceAmount: data.fiat.amount,
    status: TransactionStatus.purchasing,
    timestamp: Date.now(),
    to: data.crypto.wallet.address,
    type: TransactionType.purchase,
    fiatProvider: {
      name: FiatProviderName.Ratio,
      orderId: data.id,
      userId: extra.userId,
      analyticsSessionId: extra.analyticsSessionId,
    },
  };
}

function NetworkIcons({ networks }: { networks: string[] }) {
  const borderColor = useForegroundColor('label');

  return (
    <Box flexDirection="row" alignItems="center">
      {networks.map((network, index) => {
        return (
          <Box
            key={`availableNetwork-${network}`}
            marginTop={{ custom: -2 }}
            marginLeft={{ custom: index > 0 ? -6 : 0 }}
            style={{
              position: 'relative',
              zIndex: networks.length - index,
              borderRadius: 30,
            }}
          >
            {network !== Network.mainnet ? (
              <ChainBadge
                assetType={network}
                position="relative"
                size="small"
              />
            ) : (
              <CoinIcon
                address={ETH_ADDRESS}
                size={20}
                symbol={ETH_SYMBOL}
                type={AssetType.token}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export function Ratio({ accountAddress }: { accountAddress: string }) {
  // TODO
  const [isLoading, setIsLoading] = React.useState(false);
  const [userId, setUserId] = React.useState('');
  const analyticsSessionId = React.useMemo(() => nanoid(), []);
  const dispatch = useDispatch();

  const onTransactionComplete = React.useCallback(
    (order: RatioOrderStatus) => {
      const success = order.status === 'success';

      logger.debug(
        `Ratio: transaction complete`,
        { success, order },
        logger.DebugContext.f2c
      );

      analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
        provider: 'ratio',
        success,
        sessionId: analyticsSessionId,
      });

      if (success) {
        try {
          const transaction = ratioOrderToNewTransaction(order, {
            userId,
            analyticsSessionId,
          });
          dispatch(
            dataAddNewTransaction(
              transaction,
              order.data.crypto.wallet.address,
              true
            )
          );
        } catch (e) {
          if (e instanceof RainbowError) {
            logger.error(e);
          } else {
            logger.error(
              new RainbowError(
                `Ratio: failed to parse an order into a transaction`
              ),
              { error: e }
            );
          }
        }
      } else {
        // TODO idk what until we test this
      }
    },
    [dispatch, userId, analyticsSessionId]
  );

  return (
    <RatioComponent
      onPress={() => {
        setIsLoading(true);
        logger.debug(`Ratio: clicked`, {}, logger.DebugContext.f2c);
        analyticsV2.track(analyticsV2.event.f2cProviderFlowStarted, {
          provider: 'ratio',
          sessionId: analyticsSessionId,
        });
      }}
      onOpen={() => {
        logger.debug(`Ratio: opened`, {}, logger.DebugContext.f2c);
      }}
      fetchSessionToken={async () => {
        logger.debug(`Ratio: fetchSessionToken`, {}, logger.DebugContext.f2c);

        const { data, error } = await gretch<{ id: string }>(
          'https://f2c.rainbow.me/v1/providers/ratio/client-session',
          {
            method: 'POST',
            json: {
              signingAddress: accountAddress,
              depositAddress: accountAddress,
              signingNetwork: 'ETHEREUM',
            },
          }
        ).json();

        if (!data || error) {
          throw new Error(error);
        }

        return data?.id;
      }}
      signingCallback={async challenge => {
        logger.debug(`Ratio: signingCallback`, {}, logger.DebugContext.f2c);

        const existingWallet = await loadWallet(accountAddress, true);

        if (!existingWallet || !(existingWallet instanceof Wallet)) {
          throw new Error('No wallet found');
        }

        const { result, error } =
          (await signPersonalMessage(challenge, existingWallet)) || {};

        if (!result || error) {
          throw new Error('Signature failed');
        }

        return { signature: result };
      }}
      onLogin={async user => {
        logger.debug(`Ratio: onLogin`, {}, logger.DebugContext.f2c);
        setUserId(user.id);
      }}
      onTransactionComplete={onTransactionComplete}
      onError={error => {
        logger.error(
          new RainbowError(`Ratio component threw an error: ${error}`),
          { error }
        );
        analyticsV2.track(analyticsV2.event.f2cProviderFlowErrored, {
          provider: 'ratio',
          sessionId: analyticsSessionId,
        });
        WrappedAlert.alert(
          lang.t(lang.l.wallet.add_cash_v2.generic_error.title),
          lang.t(lang.l.wallet.add_cash_v2.generic_error.message),
          [
            {
              text: lang.t(lang.l.wallet.add_cash_v2.generic_error.button),
            },
          ]
        );
      }}
      onHelp={() => {
        // TODO
        logger.debug(`Ratio: help clicked`, {}, logger.DebugContext.f2c);
      }}
      onAccountRecovery={() => {
        // TODO
        logger.debug(
          `Ratio: account recovery clicked`,
          {},
          logger.DebugContext.f2c
        );
      }}
      onClose={() => {
        logger.debug(`Ratio: closed`, {}, logger.DebugContext.f2c);
      }}
    >
      <Box
        background="surfaceSecondaryElevated"
        padding="20px"
        borderRadius={20}
        shadow="12px"
        style={{ flex: IS_IOS ? 0 : undefined }}
      >
        <Inline alignVertical="center">
          <Box
            borderRadius={24}
            height={{ custom: 24 }}
            width={{ custom: 24 }}
            style={{ backgroundColor: 'black' }}
            alignItems="center"
            justifyContent="center"
          >
            <RatioLogo width={14} height={14} color="white" />
          </Box>
          <Box paddingLeft="8px">
            <Text size="20pt" weight="heavy" color="label">
              Ratio
            </Text>
          </Box>
        </Inline>

        <Box paddingTop="8px" paddingBottom="20px">
          <Text size="17pt" weight="semibold" color="labelSecondary">
            Works with any US bank account
          </Text>
        </Box>

        <Box flexDirection="row">
          <Box>
            <Text size="13pt" weight="semibold" color="labelTertiary">
              Instant Buy
            </Text>
            <Box flexDirection="row" alignItems="center" paddingTop="12px">
              <Text size="12pt" weight="bold" color="labelSecondary">
                􀋦
              </Text>
              <Box paddingLeft="4px">
                <Text size="15pt" weight="bold" color="label">
                  $1,250
                </Text>
              </Box>
            </Box>
          </Box>
          <Box paddingLeft="16px">
            <Text size="13pt" weight="semibold" color="labelTertiary">
              Fee
            </Text>
            <Box flexDirection="row" alignItems="center" paddingTop="12px">
              <Text size="15pt" weight="bold" color="label">
                3%
              </Text>
            </Box>
          </Box>
          <Box paddingLeft="16px">
            <Text size="13pt" weight="semibold" color="labelTertiary">
              Method
            </Text>
            <Box flexDirection="row" alignItems="center" paddingTop="12px">
              <Text size="12pt" weight="bold" color="labelSecondary">
                􀤨
              </Text>
              <Box paddingLeft="4px">
                <Text size="15pt" weight="bold" color="label">
                  Bank
                </Text>
              </Box>
            </Box>
          </Box>
          <Box paddingLeft="16px">
            <Text size="13pt" weight="semibold" color="labelTertiary">
              Networks
            </Text>
            <Box flexDirection="row" alignItems="center" paddingTop="8px">
              <NetworkIcons networks={[Network.mainnet, Network.polygon]} />
            </Box>
          </Box>
        </Box>
      </Box>
    </RatioComponent>
  );
}
