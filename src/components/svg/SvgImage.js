import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { position } from '@/styles';
import logger from '@/utils/logger';
import { CardSize } from '../unique-token/CardSize';

const ImageTile = styled(ImgixImage)({
  alignItems: 'center',
  justifyContent: 'center',
});

const sanitizeSVG = svgContent => {
  // Regular expression to find all event handler attributes
  const eventHandlerRegex = /\son\w+="[^"]*"/gi;

  // Regular expression to remove script tags
  const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  // Regular expression to sanitize href and xlink:href attributes
  const hrefRegex = /(href|xlink:href)="javascript:[^"]*"/gi;

  // Remove the event handlers, script tags, and sanitize hrefs
  let sanitizedContent = svgContent.replace(eventHandlerRegex, '');
  sanitizedContent = sanitizedContent.replace(scriptTagRegex, '');
  sanitizedContent = sanitizedContent.replace(hrefRegex, '');

  return sanitizedContent;
};

const getHTML = (svgContent, style) =>
  `
<html data-key="key-${style.height}-${style.width}">
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no"> 
  <script>
    function overLoadFunctions() {
      window.alert = () => false;
      window.prompt = () => false;
      window.confirm  = () => false;
      window.open = () => {return null};
    }
    overLoadFunctions();
    window.onload = overLoadFunctions();
  document.addEventListener('DOMContentLoaded', overLoadFunctions);

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
        user-select: none;
      }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>`.replace('<svg', `<svg onload="window.ReactNativeWebView.postMessage('loaded');"`);

const styles = {
  backgroundColor: 'transparent',
};

class SvgImage extends Component {
  state = { fetchingUrl: null, svgContent: null };
  componentDidMount() {
    this.mounted = true;
    this.doFetch(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const prevUri = this.props.source && this.props.source.uri;
    const nextUri = nextProps.source && nextProps.source.uri;

    if (nextUri && prevUri !== nextUri) {
      this.doFetch(nextProps);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  doFetch = async props => {
    let uri = props.source && props.source.uri;
    if (uri) {
      props.onLoadStart && props.onLoadStart();
      if (uri.match(/^data:image\/svg/)) {
        const index = uri.indexOf('<svg');
        this.mounted && this.setState({ fetchingUrl: uri, svgContent: uri.slice(index) });
      } else {
        try {
          const res = await fetch(uri);
          const text = await res.text();
          if (text.toLowerCase().indexOf('<svg') !== -1) {
            // TODO APP-526 more thorough investigatation into if/why foreignObject images aren't supported
            if (text.match(/<foreignObject[\s\S]*?<\/foreignObject>/)) {
              logger.log('foreignObject tag not supported', { text, uri });
              // return w/o error so we can fallback to png
              return;
            }
            this.mounted && this.setState({ fetchingUrl: uri, svgContent: text });
          } else {
            logger.log('invalid svg', { text, uri });
            this.mounted && props.onError && props.onError('invalid svg');
          }
        } catch (err) {
          logger.log('error loading remote svg image', err);
          this.mounted && props.onError && props.onError('error loading remote svg image');
        }
      }
      this.mounted && props.onLoadEnd && props.onLoadEnd();
    }
  };

  onLoad = e => {
    if (e?.nativeEvent?.data === 'loaded') {
      this.setState({ loaded: true });
      setTimeout(() => this.setState({ trulyLoaded: true }), 1000);
    }
  };

  render() {
    const props = this.props;
    const { svgContent } = this.state;

    let html;
    if (svgContent) {
      const flattenedStyle = StyleSheet.flatten(props.style) || {};
      if (svgContent.includes('viewBox')) {
        // Sanitize SVG content
        const sanitizedContent = sanitizeSVG(svgContent);
        html = getHTML(sanitizedContent, flattenedStyle);
      } else {
        const svgRegex = RegExp('(<svg)([^<]*|[^>]*)');
        const svg = svgRegex.exec(svgContent)[0];
        const regex = new RegExp('[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2', 'ig');
        const attributes = {};
        let match;
        while ((match = regex.exec(svg))) {
          attributes[match[1]] = match[3];
        }
        const patchedSvgContent = `${
          svgContent.substr(0, 5) + `viewBox="0 0 ${attributes.width} ${attributes.height}"` + svgContent.substr(5)
        }`;
        html = getHTML(patchedSvgContent, flattenedStyle);
      }
    }

    return (
      <View style={[props.containerStyle, props.style]}>
        {!this.state.trulyLoaded && props.lowResFallbackUri && (
          <ImageTile
            fm="png"
            resizeMode={ImgixImage.resizeMode.cover}
            source={{ uri: props.lowResFallbackUri }}
            style={position.coverAsObject}
            size={CardSize}
          />
        )}
        {!this.state.trulyLoaded && props.fallbackUri && (
          <ImageTile
            fm="png"
            resizeMode={ImgixImage.resizeMode.cover}
            source={{ uri: props.fallbackUri }}
            style={position.coverAsObject}
            size={CardSize}
          />
        )}
        <WebView
          onMessage={this.onLoad}
          originWhitelist={['*']}
          pointerEvents="none"
          scalesPageToFit
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          source={{ html }}
          style={[styles, props.style]}
        />
      </View>
    );
  }
}

export default SvgImage;
