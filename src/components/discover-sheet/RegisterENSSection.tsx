import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { ensAvatarUrl } from '../ens-registration/IntroMarquee/IntroMarquee';
import ENSIcon from '../icons/svg/ENSIcon';
import ImgixImage from '../images/ImgixImage';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config';
import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useWallets } from '@rainbow-me/hooks';
import { ensIntroMarqueeNames } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';
import { watchingAlert } from '@rainbow-me/utils';

export default function RegisterENSSection() {
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        fromDiscover: true,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate]);

  useEffect(() => {
    // Preload intro screen preview marquee ENS images
    ImgixImage.preload(
      ensIntroMarqueeNames.map(name => ({ uri: ensAvatarUrl(name) }))
    );
  }, []);

  const shadow = useForegroundColor('shadow');
  const shadowColor = useForegroundColor({
    custom: {
      dark: shadow,
      light: colors.gradients.ens[1],
    },
  });

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.92}
      testID="ens-register-name-banner"
    >
      <ColorModeProvider value="darkTinted">
        <AccentColorProvider color={shadowColor}>
          <Inset bottom="24px" horizontal="19px">
            <Box
              as={LinearGradient}
              background="body"
              borderRadius={24}
              colors={colors.gradients.ens}
              end={{ x: 0.5, y: 0 }}
              height={{ custom: 70 }}
              shadow={{
                custom: {
                  android: {
                    color: 'accent',
                    elevation: 24,
                    opacity: 0.5,
                  },
                  ios: [
                    {
                      blur: 24,
                      color: 'accent',
                      offset: { x: 0, y: 8 },
                      opacity: 0.35,
                    },
                  ],
                },
              }}
              start={{ x: 0, y: 0.5 }}
            >
              <Inset space="15px">
                <Inline alignVertical="center" space="10px" wrap={false}>
                  <Box alignItems="center" width={{ custom: 40 }}>
                    <ENSIcon height="40" width="40" />
                  </Box>
                  <Stack space="8px">
                    <Text color="primary" size="18px" weight="heavy">
                      {lang.t('profiles.banner.register_name')}
                    </Text>
                    <Text color="secondary70" size="16px" weight="semibold">
                      {lang.t('profiles.banner.and_create_ens_profile')}
                    </Text>
                  </Stack>
                </Inline>
              </Inset>
              <Box style={{ position: 'absolute', right: 15, top: 18 }}>
                <Text align="right" size="18px" weight="heavy">
                  􀯼
                </Text>
              </Box>
            </Box>
          </Inset>
        </AccentColorProvider>
      </ColorModeProvider>
    </ButtonPressAnimation>
  );
}
