import { toLower } from 'lodash';
import React, { useCallback, useState } from 'react';
import { SvgCssUri } from 'react-native-svg';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildUniqueTokenName } from '../../helpers/assets';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  UNIV3_NFT_CONTRACT_ADDRESS,
} from '../../references';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { Monospace, Text } from '../text';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { ImgixImage } from '@rainbow-me/images';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

const FallbackTextColorVariants = (darkMode, colors) => ({
  dark: darkMode
    ? colors.alpha(colors.white, 0.25)
    : colors.alpha(colors.blueGreyDark, 0.5),
  light: darkMode ? colors.alpha(colors.blueGreyDark, 0.25) : colors.white,
});

const getFallbackTextColor = (bg, darkMode, colors) =>
  colors.getTextColorForBackground(
    bg,
    FallbackTextColorVariants(darkMode, colors)
  );

const ImageTile = styled(ImgixImage)`
  align-items: center;
  justify-content: center;
`;

const ENSText = styled(Text).attrs(({ theme: { colors }, small }) => ({
  color: colors.whiteLabel,
  letterSpacing: 'roundedMedium',
  size: small ? 'smedium' : 'bigger',
}))`
  padding: 8px;
  text-align: center;
  ${fontWithWidth(fonts.weight.heavy)};
`;

const UniqueTokenImage = ({
  backgroundColor,
  imageUrl,
  item,
  resizeMode = ImgixImage.resizeMode.cover,
  small,
}) => {
  const isENS =
    toLower(item.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);
  const isUNIv3 =
    toLower(item.asset_contract.address) ===
    toLower(UNIV3_NFT_CONTRACT_ADDRESS);
  const image = isENS ? `${item.image_url}=s1` : imageUrl;
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();
  // UNI v3 NFTs are animated so we can't support those
  const isSVG = !isUNIv3 && isSupportedUriExtension(imageUrl, ['.svg']);

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG ? (
        <SvgCssUri
          height="100%"
          style={position.coverAsObject}
          uri={imageUrl}
          width="100%"
        />
      ) : imageUrl && !error ? (
        <ImageTile
          onError={handleError}
          resizeMode={ImgixImage.resizeMode[resizeMode]}
          source={{ uri: image }}
          style={position.coverAsObject}
        >
          {isENS && <ENSText small={small}>{item.name}</ENSText>}
        </ImageTile>
      ) : (
        <Monospace
          align="center"
          color={getFallbackTextColor(backgroundColor, isDarkMode, colors)}
          lineHeight="looser"
          size="smedium"
        >
          {buildUniqueTokenName(item)}
        </Monospace>
      )}
    </Centered>
  );
};

export default magicMemo(UniqueTokenImage, 'imageUrl');
