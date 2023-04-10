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
import upperFirst from 'lodash/upperFirst';

import { IS_IOS } from '@/env';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';
import { analyticsV2 } from '@/analytics';
import { dataAddNewTransaction } from '@/redux/data';
import { FiatProviderName } from '@/entities/f2c';
import { Network as InternalNetwork } from '@/helpers';
import { emailRainbow } from '@/utils/emailRainbow';
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
import { isAuthenticated } from '@/utils/authentication';

const ERROR_USER_FAILED_AUTH = 'user_failed_auth';

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
      value: `0-3%`,
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

      if (success) {
        try {
          analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
            provider: FiatProviderName.Ratio,
            success: true,
            sessionId: analyticsSessionId,
            fiat_amount: order.data.activity.fiat.amount,
            fiat_currency: order.data.activity.fiat.currency,
            fiat_source: 'bank',
            crypto_network: order.data.activity.crypto.wallet.network,
            crypto_amount: order.data.activity.crypto.amount || undefined,
            crypto_price: order.data.activity.crypto.price || undefined,
            crypto_currency: order.data.activity.crypto.currency,
            crypto_fee: order.data.activity.crypto.networkFee || undefined,
          });
        } catch (e) {
          // Just in case data changes during early stages of launch
          logger.error(
            new RainbowError(
              `Ratio: error tracking f2cProviderFlowCompleted event`
            ),
            { message: (e as Error).message }
          );
        }

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
        analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
          provider: FiatProviderName.Ratio,
          success: false,
          sessionId: analyticsSessionId,
        });

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

        const isAuthed = await isAuthenticated();

        if (!isAuthed) {
          throw new Error(ERROR_USER_FAILED_AUTH);
        }

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
        let title = lang.t(lang.l.wallet.add_cash_v2.generic_error.title);
        let message = lang.t(lang.l.wallet.add_cash_v2.generic_error.message);

        /**
         * If this is thrown by the Ratio SDK, it's a known error. It's what we
         * throw to fail authentication.
         */
        if (error.includes(ERROR_USER_FAILED_AUTH)) {
          title = lang.t(
            lang.l.wallet.add_cash_v2.unauthenticated_ratio_error.title
          );
          message = lang.t(
            lang.l.wallet.add_cash_v2.unauthenticated_ratio_error.message
          );
        } else {
          logger.error(
            new RainbowError(`Ratio component threw an error: ${error}`),
            { error }
          );

          analyticsV2.track(analyticsV2.event.f2cProviderFlowErrored, {
            provider: FiatProviderName.Ratio,
            sessionId: analyticsSessionId,
          });
        }

        WrappedAlert.alert(title, message, [
          {
            text: lang.t(lang.l.wallet.add_cash_v2.generic_error.button),
          },
        ]);
      }}
      onHelp={() => {
        logger.debug(`Ratio: help clicked`, {}, logger.DebugContext.f2c);
        emailRainbow({
          subject: lang.t(lang.l.wallet.add_cash_v2.support_emails.help, {
            provider: upperFirst(FiatProviderName.Ratio),
          }),
        });
      }}
      onAccountRecovery={() => {
        logger.debug(
          `Ratio: account recovery clicked`,
          {},
          logger.DebugContext.f2c
        );
        emailRainbow({
          subject: lang.t(
            lang.l.wallet.add_cash_v2.support_emails.account_recovery
          ),
        });
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
