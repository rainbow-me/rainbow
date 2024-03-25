import React from 'react';
import { AccentColorProvider, Box, DebugLayout, Inset, Stack, Text, TextIcon, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { deviceUtils } from '@/utils';
import { PointsIconAnimation } from './components/PointsIconAnimation';
import { useAccountAccentColor } from '@/hooks';
import { View } from 'react-native';
import { IS_IOS } from '@/env';

export default function ClaimPointsScreen() {
  const { goBack } = useNavigation();
  const { accentColor } = useAccountAccentColor();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <AccentColorProvider color={accentColor}>
      <Box height="full" width="full" position="absolute">
        {/* <ButtonPressAnimation onPress={goBack} style={{ width: '100%', height: '100%' }} /> */}
        <View
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flex: 1, display: 'flex' }}
          // width="full"
          // height="full"
          // alignItems="center"
          // justifyContent="center"
          pointerEvents="box-none"
          // style={{ flex: 1, left: 0, top: 0, right: 0, bottom: 0, position: 'absolute', display: 'flex', flexGrow: 1 }}
          // paddingHorizontal="20px"
        >
          <Box
            background="surfacePrimaryElevated"
            shadow="30px"
            width={{ custom: deviceUtils.dimensions.width - 40 }}
            height={{ custom: 406 }}
            style={{ borderWidth: 1, borderColor: separatorSecondary, flexGrow: 1, flex: 1 }}
            borderRadius={30}
          >
            <Box paddingBottom="60px" paddingHorizontal={{ custom: 40 }} alignItems="center">
              <Stack space="32px" alignHorizontal="center">
                <Stack space="28px" alignHorizontal="center">
                  <Stack space="20px" alignHorizontal="center">
                    <Box
                      width={{ custom: deviceUtils.dimensions.width - 40 }}
                      paddingTop="16px"
                      paddingRight="16px"
                      marginHorizontal={{ custom: -40 }}
                      alignItems="flex-end"
                    >
                      <Box
                        as={ButtonPressAnimation}
                        onPress={goBack}
                        background="fill"
                        borderRadius={32}
                        width={{ custom: 28 }}
                        height={{ custom: 28 }}
                        paddingLeft={{ custom: IS_IOS ? 1 : 0 }}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TextIcon align="center" color="label" weight="heavy" size="13pt">
                          􀆄
                        </TextIcon>
                      </Box>
                    </Box>
                    <PointsIconAnimation />
                  </Stack>
                  <Stack space="20px" alignHorizontal="center">
                    <Text align="center" color="label" weight="heavy" size="22pt">
                      You found 500 points!
                    </Text>
                    <Text align="center" color="labelTertiary" weight="semibold" size="15pt">
                      Claim your points below to receive them in next week’s drop.
                    </Text>
                  </Stack>
                </Stack>
                <Stack space="20px" alignHorizontal="center">
                  <ButtonPressAnimation overflowMargin={50}>
                    <Box
                      background="accent"
                      borderRadius={26}
                      paddingHorizontal="24px"
                      alignItems="center"
                      justifyContent="center"
                      height={{ custom: 48 }}
                      shadow="30px accent"
                    >
                      <Text align="center" color="label" weight="heavy" size="20pt">
                        Claim Points
                      </Text>
                    </Box>
                  </ButtonPressAnimation>
                  <ButtonPressAnimation>
                    <Box
                      borderRadius={26}
                      paddingHorizontal="24px"
                      alignItems="center"
                      justifyContent="center"
                      height={{ custom: 48 }}
                      style={{ borderWidth: 2, borderColor: separatorSecondary }}
                    >
                      <Text align="center" color="accent" weight="heavy" size="20pt">
                        Switch Wallets
                      </Text>
                    </Box>
                  </ButtonPressAnimation>
                </Stack>
              </Stack>
            </Box>
            <Box
              as={ButtonPressAnimation}
              onPress={goBack}
              position="absolute"
              background="blue"
              borderRadius={32}
              top={{ custom: 16 }}
              right={{ custom: 16 }}
              width={{ custom: 28 }}
              height={{ custom: 28 }}
              paddingLeft={{ custom: 1 }}
              style={{ position: 'absolute', zIndex: 99999999999999 }}
              alignItems="center"
              justifyContent="center"
            >
              <TextIcon align="center" color="label" weight="heavy" size="13pt">
                􀆄
              </TextIcon>
            </Box>
          </Box>
        </View>
      </Box>
    </AccentColorProvider>
  );
}
