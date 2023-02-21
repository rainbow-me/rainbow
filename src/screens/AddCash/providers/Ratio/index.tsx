import React from 'react';
import {
  RatioComponent,
  RatioOrderStatus,
  OrderStatus,
} from '@ratio.me/ratio-react-native-library';
import { gretch } from 'gretchen';
import { nanoid } from 'nanoid/non-secure';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

import { IS_IOS } from '@/env';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';
import { analyticsV2 } from '@/analytics';
import { dataAddNewTransaction } from '@/redux/data';
import { FiatProviderName } from '@/entities/f2c';
import { Network as InternalNetwork } from '@/helpers';
import useEmailRainbow from '@/hooks/useEmailRainbow';
import Routes from '@/navigation/routesNames';
import { ProviderCard } from '@/screens/AddCash/components/ProviderCard';
import {
  PaymentMethod,
  Network,
  FiatCurrency,
  CalloutType,
} from '@/screens/AddCash/types';
import {
  getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded,
  signWithSigningWallet,
} from '@/helpers/signingWallet';

import {
  ratioOrderToNewTransaction,
  parseRatioNetworkToInternalNetwork,
} from './utils';

const providerConfig = {
  name: FiatProviderName.Ratio,
  enabled: true,
  metadata: {
    accentColor: '#5F6162',
    paymentMethods: [
      {
        type: PaymentMethod.Bank,
      },
    ],
    networks: [Network.Ethereum, Network.Polygon],
    instantAvailable: true,
    fiatCurrencies: [FiatCurrency.USD],
  },
  callouts: [
    {
      type: CalloutType.InstantAvailable,
    },
    {
      type: CalloutType.Rate,
      value: `3%`,
    },
    {
      type: CalloutType.PaymentMethods,
      methods: [
        {
          type: PaymentMethod.Bank,
        },
      ],
    },
    {
      type: CalloutType.Networks,
      networks: [Network.Ethereum, Network.Polygon],
    },
  ],
};

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
      const success = order.status === OrderStatus.SUCCESS;

      logger.debug(
        `Ratio: transaction complete`,
        { success, order },
        logger.DebugContext.f2c
      );

      analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
        provider: FiatProviderName.Ratio,
        success,
        sessionId: analyticsSessionId,
      });

      if (success) {
        try {
          const networkName = parseRatioNetworkToInternalNetwork(
            order.data.activity.crypto.wallet.network
          );
          const isMainnet = networkName === InternalNetwork.mainnet;

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
          const transaction = await ratioOrderToNewTransaction({
            userId: order.data.userId,
            activity: order.data.activity,
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
      redirectUri={IS_IOS ? 'https://rainbow.me/plaid/oauth' : undefined}
      androidPackageName={IS_IOS ? undefined : 'me.rainbow'}
      onPress={() => {
        logger.debug(`Ratio: clicked`, {}, logger.DebugContext.f2c);
        analyticsV2.track(analyticsV2.event.f2cProviderFlowStarted, {
          provider: FiatProviderName.Ratio,
          sessionId: analyticsSessionId,
        });
      }}
      onOpen={() => {
        logger.debug(`Ratio: opened`, {}, logger.DebugContext.f2c);
      }}
      fetchSessionToken={async () => {
        logger.debug(`Ratio: fetchSessionToken`, {}, logger.DebugContext.f2c);

        const signingAddress = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();

        const { data, error } = await gretch<{ id: string }>(
          'https://f2c.rainbow.me/v1/providers/ratio/client-session',
          {
            method: 'POST',
            json: {
              signingAddress,
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

        const signature = await signWithSigningWallet(challenge);

        return { signature };
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
          provider: FiatProviderName.Ratio,
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
      <ProviderCard
        // @ts-ignore
        config={providerConfig}
      />
    </RatioComponent>
  );
}
