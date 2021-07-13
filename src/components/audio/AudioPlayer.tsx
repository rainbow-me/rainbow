import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
import Spinner from '../Spinner';
import { Centered, FlexItem } from '../layout';

const Container = styled(FlexItem)`
  background-color: ${({ theme: { colors } }) => colors.white};
`;
const StyledWebView = styled(WebView)`
  background-color: ${({ theme: { colors } }) => colors.white};
  margin-top: ${android ? 30 : 50};
`;

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

export default function WyreWebview({ uri }) {
  const webviewRef = useRef();
  const { colors, isDarkMode } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  const playerUri = useMemo(() => {
    const waveColor = isDarkMode
      ? formatColor(colors.darkModeDark)
      : formatColor(colors.lightGrey);
    const progressColor = formatColor(colors.black);
    const cursorColor = formatColor(colors.black);
    const textColor = formatColor(colors.black);
    const buttonColor = formatColor(colors.black);
    const bgColor = formatColor(colors.white);
    const buttonBackground = isDarkMode
      ? formatColor(colors.darkModeDark)
      : formatColor(colors.lighterGrey);
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
  }, [colors, isDarkMode, uri]);

  useEffect(() => {
    setTimeout(
      () => {
        setReady(true);
      },
      ios ? 1000 : 1500
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
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.white }]}
        >
          <Spinner color={colors.appleBlue} size={30} />
        </Centered>
      )}
    </Container>
  );
}
