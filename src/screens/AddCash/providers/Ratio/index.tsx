import React from 'react';
import { RatioComponent } from '@ratio.me/ratio-react-native-library';
import { gretch } from 'gretchen';
import { nanoid } from 'nanoid/non-secure';

import { Box, Text, Inline } from '@/design-system';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import { Ratio as RatioLogo } from '@/components/icons/svg/Ratio';
import { WrappedAlert } from '@/helpers/alert';
import { logger, RainbowError } from '@/logger';
import * as lang from '@/languages';
import { analyticsV2 } from '@/analytics';

export function Ratio({ accountAddress }: { accountAddress: string }) {
  // TODO
  const [isLoading, setIsLoading] = React.useState(false);
  const sessionId = React.useMemo(() => nanoid(), []);

  return (
    <RatioComponent
      fetchSessionToken={async () => {
        logger.debug(`Ratio: fetchSessionToken`, {}, logger.DebugContext.f2c);

        const { data, error } = await gretch<{ id: string }>(
          'https://f2c.rainbow.me/v1/ratio/client-session',
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

        if (!existingWallet) {
          throw new Error('No wallet found');
        }

        const { result, error } =
          (await signPersonalMessage(challenge, existingWallet)) || {};

        if (!result || error) {
          throw new Error('Signature failed');
        }

        return { signature: result };
      }}
      onPress={() => {
        setIsLoading(true);
        logger.debug(`Ratio: clicked`, {}, logger.DebugContext.f2c);
        analyticsV2.track(analyticsV2.event.f2cProviderFlowStarted, {
          provider: 'ratio',
          sessionId,
        });
      }}
      onOpen={() => {
        logger.debug(`Ratio: opened`, {}, logger.DebugContext.f2c);
      }}
      onTransactionComplete={order => {
        logger.debug(
          `Ratio: transaction complete`,
          { order },
          logger.DebugContext.f2c
        );
        analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
          provider: 'ratio',
          success: order.status === 'success',
          sessionId,
        });
      }}
      onHelp={() => {
        logger.debug(`Ratio: help clicked`, {}, logger.DebugContext.f2c);
      }}
      onAccountRecovery={() => {
        logger.debug(
          `Ratio: account recovery clicked`,
          {},
          logger.DebugContext.f2c
        );
      }}
      onError={error => {
        logger.error(
          new RainbowError(`Ratio component threw an error: ${error}`),
          { error }
        );
        analyticsV2.track(analyticsV2.event.f2cProviderFlowErrored, {
          provider: 'ratio',
          sessionId,
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
      onClose={() => {
        logger.debug(`Ratio: closed`, {}, logger.DebugContext.f2c);
      }}
    >
      <Box
        background="surfaceSecondaryElevated"
        padding="20px"
        borderRadius={20}
        shadow="12px"
        position="absolute"
        width="full"
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
          <Box paddingLeft="10px">
            <Text size="13pt" weight="bold" color="label">
              Ratio
            </Text>
          </Box>
        </Inline>

        <Box paddingTop="12px" paddingBottom="12px">
          <Text size="20pt" weight="heavy" color="label">
            Buy with a Bank Account
          </Text>
        </Box>
        <Box paddingBottom="28px">
          <Text size="15pt" weight="regular" color="labelSecondary">
            Works with any bank account.
          </Text>
        </Box>

        <Inline alignVertical="center">
          <Box borderRadius={8} padding="6px" background="fillSecondary">
            <Text size="12pt" weight="bold" color="labelSecondary">
              2.9% fee
            </Text>
          </Box>
          <Box paddingLeft="10px">
            <Text size="12pt" weight="semibold" color="labelSecondary">
              􀋦 Instant with Apple Pay
            </Text>
          </Box>
        </Inline>
      </Box>
    </RatioComponent>
  );
}
