import lang from 'i18n-js';
import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import ENSIcon from '../icons/svg/ENSIcon';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { useWallets } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { watchingAlert } from '@rainbow-me/utils';

export default function RegisterENSSection() {
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.REGISTER_ENS_NAVIGATOR);
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate]);

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.92}
      testID="ens-register-name-banner"
    >
      <AccentColorProvider color={colors.gradients.ens[1]}>
        <Inset bottom="19px" horizontal="19px">
          <Box
            as={LinearGradient}
            background="accent"
            borderRadius={24}
            colors={colors.gradients.ens}
            end={{ x: 0.6, y: 0 }}
            height={{ custom: 70 }}
            shadow="30px heavy accent"
            start={{ x: 0, y: 0.6 }}
          >
            <Inset space="15px">
              <Inline alignVertical="center" space="10px" wrap={false}>
                <Box alignItems="center" width={{ custom: 40 }}>
                  <ENSIcon height="40" width="40" />
                </Box>
                <Stack space="8px">
                  <Text size="18px" weight="heavy">
                    {lang.t('profiles.banner.register_name')}
                  </Text>
                  <Text color="secondary70" size="16px" weight="semibold">
                    {lang.t('profiles.banner.and_create_ens_profile')}
                  </Text>
                </Stack>
              </Inline>
            </Inset>
            <Box style={{ position: 'absolute', right: 15, top: 18 }}>
              <Text size="18px" weight="heavy">
                􀯼
              </Text>
            </Box>
          </Box>
        </Inset>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
