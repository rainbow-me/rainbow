import React, { useEffect, useRef } from 'react';
import WebView from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { magicMemo } from '../../utils';
import Spinner from '../Spinner';
import { Centered } from '../layout';
import { position } from '@rainbow-me/styles';

const UniqueTokenImage = ({ url }) => {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);

  const jsToExecute = `
    document.getElementsByTagName('svg')[0].setAttribute('height', '100%');
    document.getElementsByTagName('svg')[0].setAttribute('width', '100%');    
    true;
   `;

  const webRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      webRef.current?.injectJavaScript(jsToExecute);
      setTimeout(() => setReady(true), 1200);
    }, 300);
  }, [jsToExecute, webRef]);

  return (
    <Centered
      backgroundColor={colors.transparent}
      style={position.coverAsObject}
    >
      <WebView
        ref={webRef}
        scalesPageToFit
        scrollEnabled={false}
        source={{
          uri: url,
        }}
        style={{
          backgroundColor: colors.transparent,
        }}
      />
      {!ready && (
        <Centered
          backgroundColor={colors.white}
          flex={1}
          style={position.coverAsObject}
        >
          <Spinner color={colors.appleBlue} size={30} />
        </Centered>
      )}
    </Centered>
  );
};

export default magicMemo(UniqueTokenImage, 'url');
