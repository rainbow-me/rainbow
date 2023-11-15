import { ButtonPressAnimation } from '@/components/animations';
import { Box } from '@/design-system';
import { metadataClient } from '@/graphql';
import { useAccountProfile } from '@/hooks';
import { signPersonalMessage } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React, { useState } from 'react';

export default function TestContent() {
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();

  const [challenge, setChallenge] = useState<string>();

  return (
    <Box
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
      position="absolute"
    >
      {challenge ? (
        <ButtonPressAnimation
          onPress={async () => {
            const x = await signPersonalMessage(challenge);
            console.log('signature');
            console.log(x);
            console.log('onboardPoints');
            console.log(x?.result);
            try {
              const z = await metadataClient.onboardPoints({
                address: accountAddress,
                referral: 'TBDTBDTBDTBD',
                signature: x?.result as string,
              });
              console.log(z);
            } catch (e) {
              console.log(e);
            }
          }}
          style={{ width: 100, height: 100, backgroundColor: 'blue' }}
        ></ButtonPressAnimation>
      ) : (
        <ButtonPressAnimation
          onPress={async () => {
            const x = await metadataClient.getPointsOnboardChallenge({
              address: accountAddress,
              referral: 'TBDTBDTBDTBD',
            });
            console.log(x);
            setChallenge(x?.pointsOnboardChallenge);
          }}
          style={{ width: 100, height: 100, backgroundColor: 'green' }}
        ></ButtonPressAnimation>
      )}
    </Box>
  );
}
