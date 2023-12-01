import { ButtonPressAnimation } from '@/components/animations';
import { navbarHeight } from '@/components/navbar/Navbar';
import {
  Box,
  Stack,
  Text,
  useBackgroundColor,
  useForegroundColor,
} from '@/design-system';
import { useAccountAccentColor, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';

export default function ClaimContent() {
  const { accentColor } = useAccountAccentColor();
  const { navigate } = useNavigation();

  const { height: deviceHeight } = useDimensions();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const surfacePrimary = useBackgroundColor('surfacePrimary');

  const contentBottom =
    TAB_BAR_HEIGHT + (deviceHeight - navbarHeight - 218) / 2;

  return (
    <Box
      background="surfacePrimary"
      height="full"
      alignItems="center"
      justifyContent="flex-end"
      paddingHorizontal="60px"
      paddingBottom={{ custom: 132 }}
    >
      <Box position="absolute" bottom={{ custom: contentBottom }}>
        <Stack space="32px" alignHorizontal="center">
          <Stack space="20px" alignHorizontal="center">
            <Stack space="28px" alignHorizontal="center">
              <Svg width="49" height="46" viewBox="0 0 49 46" fill="none">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.20334 18.1107C7.71302 8.35378 17.9727 2.44339 28.3985 4.65944C38.8242 6.8755 45.7929 16.4479 45.0307 26.7888C44.8362 29.4268 42.6536 31.4665 40.0018 31.4698C39.6923 31.4702 39.3818 31.4637 39.0705 31.4502L26.7729 35.4531C26.1192 35.6661 25.5599 35.8483 25.0561 35.9897C25.1635 36.2635 25.2283 36.5564 25.2441 36.8589C25.2633 37.2241 25.1738 37.6452 24.9947 38.4875C24.8157 39.3297 24.7262 39.7509 24.5602 40.0767C24.1096 40.961 23.2216 41.5377 22.2305 41.5896C21.8653 41.6087 21.4442 41.5192 20.6019 41.3402C19.7597 41.1612 19.3385 41.0717 19.0127 40.9056C18.1284 40.4551 17.5517 39.567 17.4998 38.576C17.4807 38.2108 17.5702 37.7897 17.7492 36.9474C17.9282 36.1051 18.0177 35.684 18.1838 35.3581C18.3213 35.0883 18.4995 34.847 18.709 34.6406C18.3063 34.3065 17.8695 33.9126 17.3589 33.4522L7.75257 24.7935C7.46266 24.6791 7.17627 24.5587 6.89351 24.4324C4.47233 23.3509 3.30801 20.5997 4.20334 18.1107ZM25.482 10.1594C26.5947 8.73599 27.2564 8.67645 27.5314 8.73491C27.8065 8.79337 28.3868 9.11691 28.8243 10.8698C29.234 12.5112 29.3231 14.733 29.2157 17.089C29.1099 19.4107 28.8217 21.7131 28.5566 23.4471C28.4861 23.9084 28.4176 24.3273 28.3551 24.6933C26.9973 24.7424 25.6102 24.6272 24.2171 24.3311C22.8236 24.0349 21.5091 23.5757 20.2883 22.9783C20.38 22.6186 20.4877 22.2081 20.6109 21.7582C21.074 20.0662 21.7472 17.8457 22.5948 15.6817C23.455 13.4857 24.4401 11.4922 25.482 10.1594ZM36.444 26.93C35.0208 26.6275 33.6801 26.155 32.4375 25.5389C32.5103 25.1176 32.5916 24.625 32.6755 24.0767C32.9533 22.2592 33.2632 19.7995 33.3781 17.2788C33.4725 15.2068 33.4413 12.9858 33.106 11.0119C38.2522 14.2943 41.3374 20.2131 40.8753 26.4825C40.8406 26.9526 40.4615 27.3026 39.9967 27.3031C38.8272 27.3046 37.638 27.1838 36.444 26.93ZM16.5921 20.6581C16.4456 21.1933 16.3195 21.6764 16.2147 22.0911C14.8293 22.1483 13.4129 22.0346 11.9903 21.7322C10.7962 21.4784 9.66074 21.105 8.5929 20.628C8.16852 20.4385 7.96452 19.9646 8.12407 19.521C10.2517 13.6063 15.4767 9.45426 21.5124 8.54822C20.4033 10.215 19.4716 12.231 18.7152 14.1621C17.7949 16.5116 17.0775 18.8847 16.5921 20.6581ZM29.7174 28.8153C31.1989 29.6386 32.8 30.2926 34.4997 30.7471L26.3012 33.4157C26.122 33.4741 25.9536 33.5288 25.7949 33.58L29.7174 28.8153ZM26.9846 28.857C25.7816 28.8131 24.5668 28.6652 23.3508 28.4067C22.1348 28.1482 20.9647 27.7892 19.8479 27.34L21.565 33.5476C21.7299 34.1437 22.4979 34.307 22.891 33.8295L26.9846 28.857ZM17.3683 26.1905C15.6802 26.3399 13.9516 26.2862 12.2141 26.0102L18.6185 31.7827C18.7582 31.9087 18.8896 32.027 19.0136 32.1382L17.3683 26.1905Z"
                  fill={accentColor}
                />
              </Svg>
              <Text size="22pt" weight="heavy" align="center" color="label">
                {i18n.t(i18n.l.points.claim.title)}
              </Text>
            </Stack>
            <Text
              size="15pt"
              weight="semibold"
              align="center"
              color="labelTertiary"
            >
              {i18n.t(i18n.l.points.claim.subtitle)}
            </Text>
          </Stack>
          <ButtonPressAnimation
            style={{
              backgroundColor: accentColor,
              borderRadius: 26,
              height: 48,
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => navigate(Routes.CONSOLE_SHEET)}
          >
            <Text
              size="20pt"
              weight="heavy"
              align="center"
              color={{ custom: surfacePrimary }}
            >
              {i18n.t(i18n.l.points.claim.get_started)}
            </Text>
          </ButtonPressAnimation>
        </Stack>
      </Box>
      <ButtonPressAnimation
        onPress={() => navigate('ReferralContent')}
        style={{
          borderRadius: 26,
          height: 48,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: separatorSecondary,
        }}
      >
        <Text
          size="17pt"
          weight="heavy"
          align="center"
          color={{ custom: accentColor }}
        >
          {i18n.t(i18n.l.points.claim.use_referral_code)}
        </Text>
      </ButtonPressAnimation>
    </Box>
  );
}
