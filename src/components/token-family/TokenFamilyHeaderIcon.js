import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components/primitives';
import { initials } from '../../utils';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Emoji } from '../text';
import { borders, colors } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadows = [
  [0, 4, android ? 1 : 6, colors.dark, 0.04],
  [0, 1, 3, colors.dark, 0.08],
];

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
  const circleStyle = useMemo(
    () => borders.buildCircleAsObject(isCoinRow ? 40 : 32),
    [isCoinRow]
  );

  return familyName === 'Showcase' ? (
    <TrophyEmoji />
  ) : (
    <ShadowStack
      {...circleStyle}
      backgroundColor={familyImage ? colors.white : colors.purpleLight}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImageWithCachedMetadata imageUrl={familyImage} style={circleStyle} />
      ) : (
        <FallbackIcon {...circleStyle} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
};

export default React.memo(TokenFamilyHeaderIcon);
