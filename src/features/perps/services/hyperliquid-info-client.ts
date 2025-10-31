import * as hl from '@nktkas/hyperliquid';

const transport = new hl.HttpTransport();

export const infoClient: hl.InfoClient = new hl.InfoClient({
  transport,
});
