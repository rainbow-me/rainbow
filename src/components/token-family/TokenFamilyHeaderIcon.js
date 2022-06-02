import React, { useMemo } from 'react';
import { Emoji } from '../text';
import { Box } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import { FallbackIcon, initials } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = colors => [[0, 3, android ? 5 : 9, colors.shadow, 0.1]];

const EMOJI_HEADERS = {
  Selling: 'money_with_wings',
  Showcase: 'trophy',
};

const TokenFamilyHeaderIcon = ({
  familyImage,
  familyName,
  isCoinRow,
  style,
}) => {
  const { colors } = useTheme();
  const circleStyle = useMemo(
    () => borders.buildCircleAsObject(isCoinRow ? 40 : 32),
    [isCoinRow]
  );

  const shadows = useMemo(() => shadowsFactory(colors), [colors]);

  return EMOJI_HEADERS[familyName] ? (
    <Box
      alignItems="center"
      justifyContent="center"
      style={{ height: 32, width: 32 }}
    >
      <Emoji align="center" name={EMOJI_HEADERS[familyName]} size="big" />
    </Box>
  ) : (
    <ShadowStack
      {...circleStyle}
      backgroundColor={colors.white}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImgixImage
          size={isCoinRow ? 40 : 32}
          source={{ uri: familyImage }}
          style={circleStyle}
        />
      ) : (
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
};

export default React.memo(TokenFamilyHeaderIcon);
