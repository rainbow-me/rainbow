import { create, GretchResponse } from 'gretchen';
import qs from 'query-string';

import { IS_PROD } from '@/env';
import { ProviderConfig } from '@/screens/AddCash/types';
import { Address } from 'viem';
import { FiatProviderName } from '@/entities/f2c';

type ErrorResponse = {
  errors: {
    message: string;
  }[];
};

export type GetWidgetURL = (
  id: FiatProviderName,
  query: {
    redirectUri?: string;
    destinationAddress: Address;
  }
) => Promise<GretchResponse<{ url: string }, ErrorResponse>>;

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

export const getWidgetURL: GetWidgetURL = (id, query) => {
  return gretch<{ url: string }, ErrorResponse>(`/v1/providers/${id}/create-widget-url?${qs.stringify(query)}`).json();
};

export function getProviders() {
  return gretch<{ providers: ProviderConfig[] }, ErrorResponse>(`/v1/providers/list`).json();
}
