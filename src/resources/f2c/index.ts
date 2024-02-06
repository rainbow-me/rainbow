import { create } from 'gretchen';
import qs from 'query-string';

import { IS_PROD } from '@/env';
import { ProviderConfig } from '@/screens/AddCash/types';

type ErrorResponse = {
  errors: {
    message: string;
  }[];
};

const DEV_HOST = `http://localhost:8787`;
const STAGING_HOST = `https://f2c.rainbowdotme.workers.dev`;
const PROD_HOST = `https://f2c.rainbow.me`;

const gretch = create({
  baseURL: IS_PROD ? PROD_HOST : STAGING_HOST,
});

export function ratioGetClientSession({ signingAddress, depositAddress }: { signingAddress: string; depositAddress: string }) {
  return gretch<{ id: string }, ErrorResponse>('/v1/providers/ratio/client-session', {
    method: 'POST',
    json: {
      signingAddress,
      depositAddress,
      signingNetwork: 'ETHEREUM',
    },
  }).json();
}

export function coinbaseGetWidgetURL({ depositAddress }: { depositAddress: string }) {
  const query = qs.stringify({
    destinationAddress: depositAddress,
  });
  return gretch<{ url: string }, ErrorResponse>(`/v1/providers/coinbase/create-widget-url?${query}`).json();
}

export function moonpayGetWidgetURL({ depositAddress, redirectUri }: { depositAddress: string; redirectUri: string }) {
  const query = qs.stringify({
    destinationAddress: depositAddress,
    redirectUri,
  });
  return gretch<{ url: string }, ErrorResponse>(`/v1/providers/moonpay/create-widget-url?${query}`).json();
}

export function rampGetWidgetURL({ depositAddress, redirectUri }: { depositAddress: string; redirectUri: string }) {
  const query = qs.stringify({
    destinationAddress: depositAddress,
    redirectUri,
  });
  return gretch<{ url: string }, ErrorResponse>(`/v1/providers/ramp/create-widget-url?${query}`).json();
}

export function getProviders() {
  return gretch<{ providers: ProviderConfig[] }, ErrorResponse>(`/v1/providers/list`).json();
}
