import React from 'react';
import styledComponent, { css, useTheme } from 'styled-components';

// eslint-disable-next-line import/no-commonjs
const reactNative = require('react-native');

function getProps(props, attrs, theme, config) {
  const propsWithTheme = { ...props, theme };
  let propsToUse = {};

  if (typeof config?.shouldForwardProp === 'function') {
    const keys = Object.keys(propsWithTheme);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (config?.shouldForwardProp(key, () => true)) {
        propsToUse[key] = propsWithTheme[key];
      }
    }
  } else {
    propsToUse = propsWithTheme;
  }

  // .attrs((props) => ({}))
  if (typeof attrs === 'function') {
    attrs = attrs(propsToUse);
  }

  // .attrs({})
  if (typeof attrs === 'object') {
    propsToUse = { ...propsToUse, ...attrs };
  }

  return propsToUse;
}

function getStyles(styles, props) {
  // (props) => style
  if (typeof styles === 'function') {
    return {
      generatedStyles: styles(props),
    };
  } else {
    const generatedStyles = {};
    const staticStyles = {};

    const keys = Object.keys(styles);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const item = styles[key];

      if (typeof item === 'function') {
        generatedStyles[key] = item(props);
      } else {
        staticStyles[key] = item;
      }
    }

    return {
      generatedStyles,
      staticStyles,
    };
  }
}

export default function styled(Component) {
  function attrs(props) {
    StyledComponentFactory.attrs = props;
    return StyledComponentFactory;
  }

  function withConfig(config) {
    StyledComponentFactory.__config = config;
    return StyledComponentFactory;
  }

  function StyledComponentFactory(...args) {
    // console.log(args);
    const [styles, ...rest] = args;

    // if (Array.isArray(styles)) {
    //   let instance = styledComponent(Component);

    //   if (StyledComponentFactory.__config) {
    //     instance = instance.withConfig(StyledComponentFactory.__config);
    //   }

    //   if (StyledComponentFactory.__attrs) {
    //     instance = instance.attrs(StyledComponentFactory.__attrs);
    //   }

    //   return instance(styles.concat(rest));
    // }

    function StyledComponent({ style, ...props }, ref) {
      const theme = useTheme();

      const propsToUse = getProps(
        props,
        StyledComponentFactory.attrs,
        theme,
        StyledComponentFactory.__config
      );

      const { staticStyles, generatedStyles } = getStyles(styles, propsToUse);

      return (
        <Component
          ref={ref}
          {...propsToUse}
          style={[staticStyles, generatedStyles, style]}
        />
      );
    }

    const memoized = React.memo(React.forwardRef(StyledComponent));

    memoized.displayName = `StyledThing${Component.name}`;

    return memoized;
  }

  StyledComponentFactory.attrs = attrs;
  StyledComponentFactory.withConfig = withConfig;

  return StyledComponentFactory;
}

const aliases = [
  'ActivityIndicator',
  'ActivityIndicatorIOS',
  'ART',
  'Button',
  'DatePickerIOS',
  'DrawerLayoutAndroid',
  'FlatList',
  'Image',
  'ImageBackground',
  'ImageEditor',
  'ImageStore',
  'KeyboardAvoidingView',
  'ListView',
  'MapView',
  'Modal',
  'NavigatorIOS',
  'Picker',
  'PickerIOS',
  'Pressable',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'RecyclerViewBackedScrollView',
  'RefreshControl',
  'SafeAreaView',
  'ScrollView',
  'SectionList',
  'SegmentedControlIOS',
  'Slider',
  'SliderIOS',
  'SnapshotViewIOS',
  'StatusBar',
  'SwipeableListView',
  'Switch',
  'SwitchAndroid',
  'SwitchIOS',
  'TabBarIOS',
  'Text',
  'TextInput',
  'ToastAndroid',
  'ToolbarAndroid',
  'Touchable',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'View',
  'ViewPagerAndroid',
  'VirtualizedList',
  'WebView',
];

/* Define a getter for each alias which simply gets the reactNative component
 * and passes it to styled */
aliases.forEach(alias =>
  Object.defineProperty(styled, alias, {
    configurable: false,
    enumerable: true,
    get() {
      return styled(reactNative[alias]);
    },
  })
);

export { css };
