import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Spinner from '../Spinner';
import { Centered, FlexItem } from '../layout';
import styled from '@rainbow-me/styled';

const Container = styled(FlexItem)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
});

const StyledWebView = styled(WebView)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  marginTop: android ? 30 : 50,
});

const formatColor = color => color.replace('#', '');

const buildPlayerUrl = options => {
  let qsArray = [];
  for (let p in options)
    if (options.hasOwnProperty(p)) {
      qsArray.push(
        `${encodeURIComponent(p)}=${encodeURIComponent(options[p])}`
      );
    }
  const qs = qsArray.join('&');
  const base_url = `https://rainbow-me.github.io/rainbow-playa/index.html`;
  return `${base_url}?${qs}`;
};

export default function WyreWebview({ fontColor, imageColor, uri }) {
  const webviewRef = useRef();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  const playerUri = useMemo(() => {
    const waveColor = formatColor(imageColor);
    const progressColor = formatColor(imageColor);
    const cursorColor = formatColor(fontColor);
    const textColor = formatColor(fontColor);
    const buttonColor = formatColor(fontColor);
    const bgColor = formatColor(colors.transparent);
    const buttonBackground = formatColor(imageColor);
    const barWidth = 4;
    const waveformHeight = 220;

    return buildPlayerUrl({
      barWidth,
      bgColor,
      buttonBackground,
      buttonColor,
      cursorColor,
      progressColor,
      textColor,
      url: uri,
      waveColor,
      waveformHeight,
    });
  }, [colors.transparent, fontColor, imageColor, uri]);

  useEffect(() => {
    setTimeout(
      () => {
        setReady(true);
      },
      ios ? 500 : 800
    );
  }, []);

  useEffect(() => {
    // Stop the sound when closing the sheet
    return () => {
      const js = `
        try{
            wavesurfer.stop();
        } catch(e){}
     `;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      webviewRef.current?.injectJavaScript(js);
    };
  }, []);

  return (
    <Container>
      <StyledWebView
        ref={webviewRef}
        scalesPageToFit
        scrollEnabled={false}
        source={{
          uri: playerUri,
        }}
      />
      {!ready && (
        <Centered
          flex={1}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.transparent },
          ]}
        >
          <Spinner color={imageColor} size={30} />
        </Centered>
      )}
    </Container>
  );
}
