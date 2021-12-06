import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
import { Centered, FlexItem } from '../layout';

const Container = styled(FlexItem)`
  background-color: ${({ theme: { colors } }) => colors.transparent};
`;
const StyledWebView = styled(WebView)`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 30 : 50};
`;

const formatColor = (color: any) => color.replace('#', '');

const buildPlayerUrl = (options: any) => {
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

export default function WyreWebview({ fontColor, imageColor, uri }: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useRef'.
  const webviewRef = useRef();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent', false);
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StyledWebView
        ref={webviewRef}
        scalesPageToFit
        scrollEnabled={false}
        source={{
          uri: playerUri,
        }}
      />
      {!ready && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Centered
          flex={1}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.transparent },
          ]}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Spinner color={imageColor} size={30} />
        </Centered>
      )}
    </Container>
  );
}
