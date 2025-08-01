import React from 'react';
import { nanoid } from 'nanoid/non-secure';

import { logger, RainbowError } from '@/logger';
import { FiatProviderName } from '@/entities/f2c';
import { ProviderConfig } from '@/screens/AddCash/types';
import { ProviderCard } from '@/screens/AddCash/components/ProviderCard';
import { ButtonPressAnimation } from '@/components/animations';
import { analytics } from '@/analytics';
import { rampGetWidgetURL } from '@/resources/f2c';
import { WrappedAlert } from '@/helpers/alert';
import * as lang from '@/languages';
import { openInBrowser } from '@/utils/openInBrowser';

export function Ramp({ accountAddress, config }: { accountAddress: string; config: ProviderConfig }) {
  return (
    <ButtonPressAnimation
      onPress={async () => {
        try {
          const sessionId = nanoid();
          const { data, error } = await rampGetWidgetURL({
            depositAddress: accountAddress,
            redirectUri: `https://rnbw.app/f2c?provider=${FiatProviderName.Ramp}&sessionId=${sessionId}`,
          });

          if (!data || error) {
            const [{ message }] = error.errors || [];
            throw new Error(`F2C: URL generation failed: ${message}`);
          }

          const { url } = data;

          analytics.track(analytics.event.f2cProviderFlowStarted, {
            provider: FiatProviderName.Ramp,
            sessionId,
          });

          logger.debug('[AddCash]: opening provider', {
            provider: FiatProviderName.Ramp,
          });

          openInBrowser(url, false, true);
        } catch (e) {
          logger.error(new RainbowError('[AddCash]: failed to open provider'), {
            provider: FiatProviderName.Ramp,
            message: (e as Error).message,
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
        }
      }}
      overflowMargin={30}
    >
      <ProviderCard config={config} />
    </ButtonPressAnimation>
  );
}
