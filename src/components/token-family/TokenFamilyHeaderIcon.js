import React, { useMemo } from 'react';
import { Emoji } from '../text';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { borders } from '@rainbow-me/styles';
import { FallbackIcon, initials } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = colors => [[0, 3, android ? 5 : 9, colors.shadow, 0.1]];

const TrophyEmoji = styled(Emoji).attrs({
  align: 'center',
  name: 'trophy',
  size: 'medium',
})({
  height: 22,
  marginRight: 4.5,
  textAlignVertical: 'center',
});

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

  return familyName === 'Showcase' ? (
    <TrophyEmoji />
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
