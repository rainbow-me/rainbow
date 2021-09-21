// @flow

import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import logger from 'logger';

const getHTML = (svgContent, style) => `
<html data-key="key-${style.height}-${style.width}">
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no"> 
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
</html>
`;

const styles = {
  backgroundColor: 'transparent',
  height: 100,
  width: 200,
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
        this.mounted &&
          this.setState({ fetchingUrl: uri, svgContent: uri.slice(index) });
      } else {
        try {
          const res = await fetch(uri);
          const text = await res.text();
          this.mounted && this.setState({ fetchingUrl: uri, svgContent: text });
        } catch (err) {
          logger.log('error loading remote svg image', err);
        }
      }
      this.mounted && props.onLoadEnd && props.onLoadEnd();
    }
  };
  render() {
    const props = this.props;
    const { svgContent } = this.state;
    if (svgContent) {
      const flattenedStyle = StyleSheet.flatten(props.style) || {};
      let html;
      if (svgContent.includes('viewBox')) {
        html = getHTML(svgContent, flattenedStyle);
      } else {
        const svgRegex = RegExp('(<svg)([^<]*|[^>]*)');
        const svg = svgRegex.exec(svgContent)[0];
        const regex = new RegExp(
          '[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2',
          'ig'
        );
        const attributes = {};
        let match;
        while ((match = regex.exec(svg))) {
          attributes[match[1]] = match[3];
        }
        const patchedSvgContent = `${
          svgContent.substr(0, 5) +
          `viewBox="0 0 ${attributes.width} ${attributes.height}"` +
          svgContent.substr(5)
        }`;
        html = getHTML(patchedSvgContent, flattenedStyle);
      }

      return (
        <View style={[props.style, props.containerStyle]}>
          <WebView
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
    } else {
      return (
        <View
          pointerEvents="none"
          style={[props.containerStyle, props.style]}
        />
      );
    }
  }
}

export default SvgImage;
