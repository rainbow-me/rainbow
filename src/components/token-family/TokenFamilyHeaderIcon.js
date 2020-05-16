import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import ShadowStack from 'react-native-shadow-stack';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { borders, colors } from '../../styles';
import { initials } from '../../utils';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';
import { Emoji } from '../text';

const shadows = [
  [0, 4, 6, colors.dark, 0.04],
  [0, 1, 3, colors.dark, 0.08],
];

const TrophyEmoji = styled(Emoji).attrs({
  align: 'center',
  name: 'trophy',
  size: 'medium',
})`
  height: 30;
  margin-right: 4.5;
  text-align-vertical: center;
`;

const TokenFamilyHeaderIcon = ({
  familyImage,
  familyName,
  isCoinRow,
  style,
}) => {
  const imageSource = useMemo(() => ({ uri: familyImage }), [familyImage]);
  const size = borders.buildCircleAsObject(isCoinRow ? 40 : 32);

  return familyName === 'Showcase' ? (
    <TrophyEmoji />
  ) : (
    <ShadowStack
      {...size}
      backgroundColor={familyImage ? colors.white : colors.purpleLight}
      shadows={shadows}
      style={style}
    >
      {familyImage ? (
        <ImageWithCachedDimensions
          id={familyImage}
          source={imageSource}
          style={size}
        />
      ) : (
        <FallbackIcon {...size} symbol={initials(familyName)} />
      )}
    </ShadowStack>
  );
};

TokenFamilyHeaderIcon.propTypes = {
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  isCoinRow: PropTypes.bool,
  style: stylePropType,
};

export default React.memo(TokenFamilyHeaderIcon);
