import React from 'react';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { useDimensions } from '@/hooks';
import { FloatingEmojisTapper } from '@/components/floating-emojis';
import { PointsIconAnimation } from '../components/PointsIconAnimation';

export function PlaceholderContent() {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  return (
    <>
      <Box alignItems="center" position="absolute" height="full" width="full" style={{ zIndex: -1 }} justifyContent="center">
        <Box paddingBottom="104px" width="full">
          <Stack alignHorizontal="center" space="28px">
            <PointsIconAnimation />
            <Stack alignHorizontal="center" space="20px">
              <Text align="center" color="labelTertiary" size="26pt" weight="semibold">
                {i18n.t(i18n.l.points.placeholder.coming_soon_title)}
              </Text>
              <Text align="center" color="labelQuaternary" size="15pt" weight="medium">
                {i18n.t(i18n.l.points.placeholder.coming_soon_description)}
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Box
        as={FloatingEmojisTapper}
        distance={500}
        duration={4000}
        emojis={['rainbow', 'rainbow', 'rainbow', 'slot_machine', 'slot_machine']}
        gravityEnabled
        position="absolute"
        range={[0, 0]}
        size={80}
        wiggleFactor={0}
        yOffset={-66}
      >
        <Box
          position="absolute"
          style={{
            height: deviceHeight,
            width: deviceWidth,
          }}
        />
      </Box>
    </>
  );
}
