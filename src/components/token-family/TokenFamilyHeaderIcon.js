import PropTypes from 'prop-types';
import React from 'react';
import { FallbackIcon } from 'react-coin-icon';
import ShadowStack from 'react-native-shadow-stack';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { borders, colors, fonts } from '../../styles';
import { initials } from '../../utils';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';
import { Text } from '../text';

const Container = styled(Text)`
  font-size: ${fonts.size.medium};
  height: 30;
  margin-right: 4.5;
  text-align-vertical: center;
  text-align: center;
`;

const TokenFamilyHeaderIcon = ({
  familyImage,
  familyName,
  isCoinRow,
  style,
}) => {
  const size = borders.buildCircleAsObject(isCoinRow ? 40 : 32);
  return familyName === 'Showcase' ? (
    <Container>🏆</Container>
  ) : (
    <ShadowStack
      {...size}
      backgroundColor={familyImage ? colors.white : colors.purpleLight}
      shadows={[
        [0, 4, 6, colors.dark, 0.04],
        [0, 1, 3, colors.dark, 0.08],
      ]}
      style={style}
    >
      {familyImage ? (
        <ImageWithCachedDimensions
          id={familyImage}
          source={{ uri: familyImage }}
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
