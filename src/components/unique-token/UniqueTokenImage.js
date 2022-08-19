import { BlurView } from '@react-native-community/blur';
import React, { Fragment, useCallback, useState } from 'react';
import { View } from 'react-native';
import { buildUniqueTokenName } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { Monospace } from '../text';
import { Text } from '@/design-system';
import svgToPngIfNeeded from '@/handlers/svgs';
import { useHiddenTokens } from '@/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { ENS_NFT_CONTRACT_ADDRESS } from '@rainbow-me/references';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import isSVGImage from '@rainbow-me/utils/isSVG';

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

const ImageTile = styled(ImgixImage)({
  alignItems: 'center',
  justifyContent: 'center',
});

const OverlayBlur = styled(BlurView).attrs(({ isDarkMode }) => ({
  blurAmount: 40,
  blurType: isDarkMode ? 'dark' : 'light',
}))({
  ...position.coverAsObject,
  zIndex: 1,
});

const UniqueTokenImage = ({
  backgroundColor: givenBackgroundColor,
  imageUrl,
  item,
  isCard = false,
  resizeMode = ImgixImage.resizeMode.cover,
  size,
  transformSvgs = true,
}) => {
  const isENS =
    item.asset_contract?.address?.toLowerCase() ===
    ENS_NFT_CONTRACT_ADDRESS.toLowerCase();
  const isSVG = isSVGImage(imageUrl);
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();
  const [loadedImg, setLoadedImg] = useState(false);
  const onLoad = useCallback(() => setLoadedImg(true), [setLoadedImg]);
  let backgroundColor = givenBackgroundColor;
  const { hiddenTokens } = useHiddenTokens();
  const isHiddenToken = React.useMemo(() => {
    return hiddenTokens.find(token => token === item.fullUniqueId);
  }, [hiddenTokens, item]);

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG && !transformSvgs && !error ? (
        <RemoteSvg
          fallbackIfNonAnimated={!isENS || isCard}
          fallbackUri={svgToPngIfNeeded(imageUrl, true)}
          lowResFallbackUri={item.lowResUrl}
          onError={handleError}
          resizeMode={resizeMode}
          style={position.coverAsObject}
          uri={item.image_url}
        />
      ) : imageUrl && !error ? (
        <Fragment>
          <ImageTile
            {...(isCard && { fm: 'png' })}
            onError={handleError}
            onLoad={onLoad}
            resizeMode={ImgixImage.resizeMode[resizeMode]}
            retryOnError
            size={size}
            source={{ uri: imageUrl }}
            style={position.coverAsObject}
          />
          {!loadedImg && (
            <ImageTile
              fm="png"
              playing={false}
              resizeMode={ImgixImage.resizeMode[resizeMode]}
              source={{ uri: item.lowResUrl }}
              style={position.coverAsObject}
            />
          )}
        </Fragment>
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

      {isHiddenToken && isCard && (
        <>
          <OverlayBlur isDarkMode={isDarkMode} />
          <View style={{ paddingHorizontal: 10 }} zIndex={2}>
            <Text
              align="center"
              color="secondary60"
              lineHeight="looser"
              size="14px"
              weight="semibold"
            >
              {`${item.familyName} #${item.id}`}
            </Text>
          </View>
        </>
      )}
    </Centered>
  );
};

export default UniqueTokenImage;
