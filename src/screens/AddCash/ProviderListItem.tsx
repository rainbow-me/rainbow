import React from 'react';
import { nanoid } from 'nanoid/non-secure';

import { logger, RainbowError } from '@/logger';
import { ProviderConfig } from '@/screens/AddCash/types';
import { ProviderCard } from '@/screens/AddCash/components/ProviderCard';
import { ButtonPressAnimation } from '@/components/animations';
import { analytics } from '@/analytics';
import { WrappedAlert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { openInBrowser } from '@/utils/openInBrowser';
import { GetWidgetURL } from '@/resources/f2c';
import { Address } from 'viem';
import { FiatProviderName } from '@/entities/f2c';

interface ProviderListItemProps {
  config: ProviderConfig;
  accountAddress: Address;
  getWidgetURL: GetWidgetURL;
}

export function ProviderListItem({ accountAddress, config, getWidgetURL }: ProviderListItemProps) {
  const onPress = async () => {
    try {
      const sessionId = nanoid();
      // TODO: replace hardcoded rnbw.app link
      const redirectUri = `https://rnbw.app/f2c?provider=${config.id}&sessionId=${sessionId}`;
      // we're only passing redirect URL to Moonpay for now
      const query = { destinationAddress: accountAddress, ...(config.id === FiatProviderName.Moonpay ? { redirectUri } : {}) };
      const { data } = await getWidgetURL(config.id, query);

      const { url } = data;

      analytics.track(analytics.event.f2cProviderFlowStarted, {
        provider: config.id,
        sessionId,
      });

      logger.debug('[AddCash]: opening provider', {
        provider: config.id,
      });

      openInBrowser(url, false, true);
    } catch (e) {
      logger.error(new RainbowError('[AddCash]: failed to open provider'), {
        provider: config.id,
        message: (e as Error).message,
      });

      WrappedAlert.alert(i18n.t(i18n.l.wallet.add_cash_v2.generic_error.title), i18n.t(i18n.l.wallet.add_cash_v2.generic_error.message), [
        {
          text: i18n.t(i18n.l.wallet.add_cash_v2.generic_error.button),
        },
      ]);
    }
  };

  return (
    <ButtonPressAnimation onPress={onPress} overflowMargin={30}>
      <ProviderCard config={config} />
    </ButtonPressAnimation>
  );
}
