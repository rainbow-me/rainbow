import { create } from 'gretchen';
import { ActivityItem } from '@ratio.me/ratio-react-native-library';

type ErrorResponse = {
  errors: {
    message: string;
  }[];
};

const gretch = create({
  // baseURL: `https://f2c.rainbowdotme.workers.dev`, // staging
  baseURL: `https://f2c.rainbow.me`,
});

export function ratioGetClientSession({
  signingAddress,
  depositAddress,
}: {
  signingAddress: string;
  depositAddress: string;
}) {
  return gretch<{ id: string }, ErrorResponse>(
    '/v1/providers/ratio/client-session',
    {
      method: 'POST',
      json: {
        signingAddress,
        depositAddress,
        signingNetwork: 'ETHEREUM',
      },
    }
  ).json();
}

export function ratioGetUserActivityItem({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) {
  return gretch<ActivityItem, ErrorResponse>(
    `/v1/providers/ratio/users/${userId}/activity/${orderId}`
  ).json();
}
