import React from 'react';
import {
  RatioComponent,
  RatioOrderStatus,
} from '@ratio.me/ratio-react-native-library';
import { gretch } from 'gretchen';
import { nanoid } from 'nanoid/non-secure';
import { Wallet } from '@ethersproject/wallet';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

import { IS_IOS } from '@/env';
import { Box, Text, Inline, useForegroundColor } from '@/design-system';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import { Ratio as RatioLogo } from '@/components/icons/svg/Ratio';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';
import { analyticsV2 } from '@/analytics';
import { AssetType } from '@/entities';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { dataAddNewTransaction } from '@/redux/data';
import { FiatProviderName } from '@/entities/f2c';
import { Network } from '@/helpers';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { CoinIcon } from '@/components/coin-icon';
import useEmailRainbow from '@/hooks/useEmailRainbow';
import Routes from '@/navigation/routesNames';

import {
  ratioOrderToNewTransaction,
  parseRatioNetworkToInternalNetwork,
} from './utils';

function NetworkIcons({ networks }: { networks: string[] }) {
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
  const [userId, setUserId] = React.useState('');
  const analyticsSessionId = React.useMemo(() => nanoid(), []);
  const dispatch = useDispatch();
  const emailRainbow = useEmailRainbow({
    subject: lang.t(lang.l.wallet.add_cash_v2.support_email_subject, {
      provider: FiatProviderName.Ratio,
    }),
  });
  const pendingTransactionSheetExplainerType = React.useRef('');
  const { navigate } = useNavigation();

  const onTransactionComplete = React.useCallback(
    async (order: RatioOrderStatus) => {
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
          const networkName = parseRatioNetworkToInternalNetwork(
            order.data.activity.crypto.wallet.network
          );
          const isMainnet = networkName === Network.mainnet;

          /**
           * Handle this check synchronously before we run
           * ratioOrderToNewTransaction. THis ensures that the user hasn't
           * closed the modal before that async function has returned.
           */
          if (!isMainnet) {
            logger.log(
              `Ratio: transaction is not on mainnet, will not add to transaction list data`,
              {
                network: order.data.activity.crypto.wallet.network,
              }
            );

            // set this to show the explainer sheet onClose of the modal
            pendingTransactionSheetExplainerType.current =
              'f2cSemiSupportedAssetPurchased';
          }

          // OK now we can run this async function
          const transaction = await ratioOrderToNewTransaction(order, {
            analyticsSessionId,
          });

          logger.debug(
            `Ratio: transaction parsed`,
            { transaction },
            logger.DebugContext.f2c
          );

          // for now we only support L1 transaction data from our backend
          if (isMainnet) {
            logger.debug(
              `Ratio: transaction is on mainnet, adding to transaction list data`,
              {},
              logger.DebugContext.f2c
            );

            dispatch(
              dataAddNewTransaction(
                transaction,
                order.data.activity.crypto.wallet.address,
                true
              )
            );
          }
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
        logger.warn(`Ratio: order completed but success === false`, {
          error: order.error,
        });

        WrappedAlert.alert(
          lang.t(lang.l.wallet.add_cash_v2.generic_error.title),
          order.error.message ||
            lang.t(lang.l.wallet.add_cash_v2.generic_error.message),
          [
            {
              text: lang.t(lang.l.wallet.add_cash_v2.generic_error.button),
            },
          ]
        );
      }
    },
    [dispatch, userId, analyticsSessionId, pendingTransactionSheetExplainerType]
  );

  return (
    <RatioComponent
      onPress={() => {
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
        logger.debug(`Ratio: help clicked`, {}, logger.DebugContext.f2c);
        emailRainbow();
      }}
      onAccountRecovery={() => {
        logger.debug(
          `Ratio: account recovery clicked`,
          {},
          logger.DebugContext.f2c
        );
        emailRainbow();
      }}
      onClose={() => {
        logger.debug(
          `Ratio: closed`,
          {
            showingL2Explainer: Boolean(
              pendingTransactionSheetExplainerType.current
            ),
          },
          logger.DebugContext.f2c
        );

        // assign to variable to avoid ref updates before interactions finish
        const explainerType = pendingTransactionSheetExplainerType.current;

        if (explainerType) {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              navigate(Routes.EXPLAIN_SHEET, {
                type: explainerType,
              });
            }, 1000);
          });
        }

        pendingTransactionSheetExplainerType.current = '';
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
