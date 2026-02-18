import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { IS_PROD } from '@/env';
import { ProviderConfig } from '@/screens/AddCash/types';
import { Address } from 'viem';
import { FiatProviderName } from '@/entities/f2c';

export type GetWidgetURL = (
  id: FiatProviderName,
  query: {
    redirectUri?: string;
    destinationAddress: Address;
  }
) => Promise<{ data: { url: string }; headers: Headers; status: number }>;

const DEV_HOST = `http://localhost:8787`;
const STAGING_HOST = `https://f2c.rainbowdotme.workers.dev`;
const PROD_HOST = `https://f2c.rainbow.me`;

const f2cClient = new RainbowFetchClient({
  baseURL: IS_PROD ? PROD_HOST : STAGING_HOST,
});

export function ratioGetClientSession({ signingAddress, depositAddress }: { signingAddress: string; depositAddress: string }) {
  return f2cClient.post<{ id: string }>('/v1/providers/ratio/client-session', {
    signingAddress,
    depositAddress,
    signingNetwork: 'ETHEREUM',
  });
}

export const getWidgetURL: GetWidgetURL = (id, query) => {
  return f2cClient.get<{ url: string }>(`/v1/providers/${id}/create-widget-url`, {
    params: query as Record<string, string>,
  });
};

export function getProviders() {
  return f2cClient.get<{ providers: ProviderConfig[] }>('/v2/providers/list');
}
