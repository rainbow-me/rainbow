import * as lang from '@/languages';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../text';
import WalletAndBackup from '@/assets/walletsAndBackup.png';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { Box, Inset, Stack } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { ImgixImage } from '../images';
import { AllRainbowWalletsData } from '@/model/wallet';
import walletBackupTypes from '@/helpers/walletBackupTypes';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'big',
  weight: 'bold',
})({
  ...margin.object(15, 0, 12),
});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

type ChooseBackupStepParams = {
  ChooseBackupStep: {
    userData: AllRainbowWalletsData;
  };
};

export default function ChooseBackupStep() {
  const {
    params: { userData },
  } = useRoute<RouteProp<ChooseBackupStepParams, 'ChooseBackupStep'>>();

  const { height: deviceHeight } = useDimensions();
  const { navigate, goBack } = useNavigation();

  const cloudBackups = Object.values(userData.wallets).filter(wallet => {
    return wallet.backupType === walletBackupTypes.cloud && wallet.backedUp;
  });

  console.log(JSON.stringify(cloudBackups, null, 2));

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
      <Inset height="full" horizontal={'24px'}>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="12px">
              <Title>
                {lang.t(lang.l.back_up.cloud.password.choose_a_password)}
              </Title>
            </Stack>
          </Masthead>
        </Stack>
      </Inset>
    </Box>
  );
}
