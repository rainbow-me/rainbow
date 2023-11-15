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
          }}
          style={{ width: 100, height: 100, backgroundColor: 'blue' }}
        ></ButtonPressAnimation>
      ) : (
        <ButtonPressAnimation
          onPress={async () => {
            const x = await metadataClient.getPointsOnboardChallenge({
              address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
              referral: 'a',
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
