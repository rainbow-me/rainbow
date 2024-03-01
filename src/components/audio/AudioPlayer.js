import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Spinner from '../Spinner';
import { Centered, FlexItem } from '../layout';
import { StatusBarHelper } from '@/helpers';
import styled from '@/styled-thing';

const Container = styled(FlexItem)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
});

const StyledWebView = styled(WebView)({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  marginTop: android ? 30 : 50,
});

const formatColor = color => (color && typeof color === 'string' ? color.replace('#', '') : null);

const buildPlayerUrl = options => {
  const qsArray = [];
  for (const p in options)
    if (options.hasOwnProperty(p)) {
      qsArray.push(`${encodeURIComponent(p)}=${encodeURIComponent(options[p])}`);
    }
  const qs = qsArray.join('&');
  const base_url = `https://rainbow-me.github.io/rainbow-playa/index.html`;
  return `${base_url}?${qs}`;
};

export default function AudioPlayer({ fontColor, imageColor, uri }) {
  const webviewRef = useRef();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    StatusBarHelper.setBackgroundColor('transparent', false);
    StatusBarHelper.setTranslucent(true);
    StatusBarHelper.setDarkContent();
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
      setClosed(true);
    };
  }, []);

  return (
    <Container>
      {!closed && (
        <StyledWebView
          ref={webviewRef}
          scalesPageToFit
          scrollEnabled={false}
          source={{
            uri: playerUri,
          }}
        />
      )}
      {!ready && (
        <Centered flex={1} style={[StyleSheet.absoluteFill, { backgroundColor: colors.transparent }]}>
          <Spinner color={imageColor} size={30} />
        </Centered>
      )}
    </Container>
  );
}
