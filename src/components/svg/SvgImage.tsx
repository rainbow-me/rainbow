// @flow
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const ImageTile = styled(ImgixImage)`
  align-items: center;
  justify-content: center;
`;

const getHTML = (svgContent: any, style: any) =>
  `
<html data-key="key-${style.height}-${style.width}">
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no"> 
  <script>
    function overLoadFunctions() {
      window.alert = () => false;
      window.prompt = () => false;
      window.confirm  = () => false;
    }
    overLoadFunctions();
    window.onload = overLoadFunctions();
  </script>
  <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
        background-color: transparent;
      }
      svg {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>`.replace(
    '<svg',
    `<svg onload="window.ReactNativeWebView.postMessage('loaded');"`
  );

const styles = {
  backgroundColor: 'transparent',
};

class SvgImage extends Component {
  mounted: any;
  state = { fetchingUrl: null, svgContent: null };
  componentDidMount() {
    this.mounted = true;
    this.doFetch(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'source' does not exist on type 'Readonly... Remove this comment to see the full error message
    const prevUri = this.props.source && this.props.source.uri;
    const nextUri = nextProps.source && nextProps.source.uri;

    if (nextUri && prevUri !== nextUri) {
      this.doFetch(nextProps);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  doFetch = async (props: any) => {
    let uri = props.source && props.source.uri;
    if (uri) {
      props.onLoadStart && props.onLoadStart();
      if (uri.match(/^data:image\/svg/)) {
        const index = uri.indexOf('<svg');
        this.mounted &&
          this.setState({ fetchingUrl: uri, svgContent: uri.slice(index) });
      } else {
        try {
          const res = await fetch(uri);
          const text = await res.text();
          if (text.toLowerCase().indexOf('<svg') !== -1) {
            this.mounted &&
              this.setState({ fetchingUrl: uri, svgContent: text });
          } else {
            logger.log('invalid svg', { text, uri });
            this.mounted && props.onError && props.onError('invalid svg');
          }
        } catch (err) {
          logger.log('error loading remote svg image', err);
          this.mounted &&
            props.onError &&
            props.onError('error loading remote svg image');
        }
      }
      this.mounted && props.onLoadEnd && props.onLoadEnd();
    }
  };

  onLoad = (e: any) => {
    if (e?.nativeEvent?.data === 'loaded') {
      this.setState({ loaded: true });
      setTimeout(() => this.setState({ trulyLoaded: true }), 1000);
    }
  };
  render() {
    const props = this.props;
    const { svgContent } = this.state;
    if (svgContent) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Readonly<... Remove this comment to see the full error message
      const flattenedStyle = StyleSheet.flatten(props.style) || {};
      let html;
      // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
      if (svgContent.includes('viewBox')) {
        html = getHTML(svgContent, flattenedStyle);
      } else {
        const svgRegex = RegExp('(<svg)([^<]*|[^>]*)');
        // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
        const svg = svgRegex.exec(svgContent)[0];
        const regex = new RegExp(
          '[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2',
          'ig'
        );
        const attributes = {};
        let match;
        while ((match = regex.exec(svg))) {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          attributes[match[1]] = match[3];
        }
        const patchedSvgContent = `${
          // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
          svgContent.substr(0, 5) +
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type '{}'.
          `viewBox="0 0 ${attributes.width} ${attributes.height}"` +
          // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
          svgContent.substr(5)
        }`;
        html = getHTML(patchedSvgContent, flattenedStyle);
      }

      const isSVGAnimated = html?.indexOf('<animate') !== -1;

      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View style={[props.style, props.containerStyle]}>
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'trulyLoaded' does not exist on type '{ f... Remove this comment to see the full error message
          {!this.state.trulyLoaded && props.lowResFallbackUri && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ImageTile
              resizeMode={ImgixImage.resizeMode.cover}
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'lowResFallbackUri' does not exist on typ... Remove this comment to see the full error message
              source={{ uri: props.lowResFallbackUri }}
              style={position.coverAsObject}
            />
          )}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'trulyLoaded' does not exist on type '{ f... Remove this comment to see the full error message
          {!this.state.trulyLoaded && props.fallbackUri && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ImageTile
              resizeMode={ImgixImage.resizeMode.cover}
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'fallbackUri' does not exist on type 'Rea... Remove this comment to see the full error message
              source={{ uri: props.fallbackUri }}
              style={position.coverAsObject}
            />
          )}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'fallbackIfNonAnimated' does not exist on... Remove this comment to see the full error message
          {(!props.fallbackIfNonAnimated || isSVGAnimated) && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <WebView
              onMessage={this.onLoad}
              originWhitelist={['*']}
              pointerEvents="none"
              scalesPageToFit
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              source={{ html }}
              style={[
                styles,
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Readonly<... Remove this comment to see the full error message
                props.style,
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'loaded' does not exist on type '{ fetchi... Remove this comment to see the full error message
                { display: this.state.loaded || android ? 'flex' : 'none' },
              ]}
            />
          )}
        </View>
      );
    } else {
      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <View
          pointerEvents="none"
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'containerStyle' does not exist on type '... Remove this comment to see the full error message
          style={[props.containerStyle, props.style]}
        />
      );
    }
  }
}

export default SvgImage;
