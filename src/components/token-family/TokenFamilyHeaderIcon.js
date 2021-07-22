import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components';
import { initials } from '../../utils';
import { Emoji } from '../text';
import { ImgixImage } from '@rainbow-me/images';
import { borders } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = colors => [[0, 3, 9, colors.shadow, 0.1]];

const TrophyEmoji = styled(Emoji).attrs({
  align: 'center',
  name: 'trophy',
  size: 'medium',
})`
  height: 22;
  margin-right: 4.5;
  text-align-vertical: center;
`;

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
        <ImgixImage source={{ uri: familyImage }} style={circleStyle} />
      ) : (
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
};

export default React.memo(TokenFamilyHeaderIcon);
