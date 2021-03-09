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
export default function WyreWebview({ uri }) {
  const webviewRef = useRef();
  const { colors, isDarkMode } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  const waveColor = isDarkMode
    ? colors.darkModeDark.replace('#', '')
    : colors.lightGrey.replace('#', '');
  const progressColor = colors.black.replace('#', '');
  const cursorColor = colors.black.replace('#', '');
  const textColor = colors.black.replace('#', '');
  const buttonColor = colors.black.replace('#', '');
  const bgColor = colors.white.replace('#', '');
  const buttonBackground = isDarkMode
    ? colors.darkModeDark.replace('#', '')
    : colors.lighterGrey.replace('#', '');
  const barWidth = 4;
  const waveformHeight = 220;

  const playerUri = `https://rainbow-me.github.io/rainbow-playa/index.html?bgColor=${bgColor}&waveColor=${waveColor}&progressColor=${progressColor}&cursorColor=${cursorColor}&buttonColor=${buttonColor}&buttonBackground=${buttonBackground}&textColor=${textColor}&barWidth=${barWidth}&waveformHeight=${waveformHeight}&url=${encodeURIComponent(
    uri
  )}`;

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
