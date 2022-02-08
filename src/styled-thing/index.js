import React from 'react';
import isEqual from 'react-fast-compare';
import { css } from 'styled-components';

import hoist from './hoist';
// eslint-disable-next-line import/no-commonjs
const reactNative = require('react-native');
const ThemeContext = React.createContext();

function useTheme() {
  return React.useContext(ThemeContext);
}

export function StyleThingThemeProvider({ value, children }) {
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function filterProps(props, shouldForwardProp) {
  if (typeof shouldForwardProp === 'function') {
    const forwardedProps = {};
    const keys = Object.keys(props);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // TODO (terry): Make sure we don't pass `as` and all the `$` props for web compatibility
      // in the styled components sources they somehow convert all the `as` props into forwardedAs props
      // we don't do that so we just use `as` prop as is.
      // https://github.dev/styled-components/styled-components/blob/80cf751528f5711349dd3c27621022b4c95b4b7f/packages/styled-components/src/models/StyledNativeComponent.ts#L73-L80

      if (shouldForwardProp(key, () => true)) {
        forwardedProps[key] = props[key];
      }
    }
    return forwardedProps;
  } else {
    return props;
  }
}

function useResolvedAttrs(theme = {}, props, attrs = []) {
  // NOTE: can't memoize this
  // returns [context, resolvedAttrs]
  // where resolvedAttrs is only the things injected by the attrs themselves
  const context = { ...props, theme };
  const resolvedAttrs = {};

  for (let i = 0; i < attrs.length; i++) {
    const attrDef = attrs[i];
    let resolvedAttrDef =
      typeof attrDef === 'function' ? attrDef(context) : attrDef;
    let key;

    for (key in resolvedAttrDef) {
      context[key] = resolvedAttrs[key] = resolvedAttrDef[key];
    }
  }

  return [context, resolvedAttrs];
}

function processStyles(nestedStyles, props) {
  let result = {};

  for (let i = 0; i < nestedStyles.length; i++) {
    const styles = nestedStyles[i];

    if (typeof styles === 'function') {
      Object.assign(result, styles(props));
    } else if (typeof styles === 'object') {
      const keys = Object.keys(styles);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const item = styles[key];

        result[key] = typeof item === 'function' ? item(props) : item;
      }
    }
  }

  return result;
}

export default function styled(Component) {
  function attrs(props) {
    StyledComponentFactory.addedAttrs = props;
    return StyledComponentFactory;
  }

  function withConfig(config) {
    if (config?.shouldForwardProp) {
      StyledComponentFactory.shouldForwardProp = config.shouldForwardProp;
    }

    return StyledComponentFactory;
  }

  function StyledComponentFactory(styles) {
    if (__DEV__) {
      if (Array.isArray(styles)) {
        throw new TypeError(
          '@rainbow-me/styled-components only support object syntax.\nUse the function call with an object as an argument instead of template literal string, for example styled({}) instead of styled``\nSee https://github.com/rainbow-me/rainbow/pull/2730'
        );
      }
    }

    let WrappedStyledComponent;

    let shouldForwardProp = StyledComponentFactory.shouldForwardProp;

    function StyledComponent({ style, ...props }, ref) {
      const theme = useTheme() ?? {};

      const [context, attributes] = useResolvedAttrs(
        theme,
        props,
        WrappedStyledComponent.attrs
      );

      const elementToBeCreated =
        attributes?.$as ||
        props.$as ||
        attributes?.as ||
        props.as ||
        WrappedStyledComponent.target;

      const generatedStyles = processStyles(
        WrappedStyledComponent.styles,
        context
      );

      const computedProps = { ...props, ...attributes };
      // we don't need to pass it since we used it as elementToBeCreated
      // assigning `undefined` will result into wrong `Object.assign` operations
      // in the userland for example
      // Object.assign({ as: true }, { as: undefined }) // { as: undefined }
      delete computedProps.as;
      delete computedProps.$as;

      const forwardedProps = filterProps(
        computedProps,
        WrappedStyledComponent.shouldForwardProp
      );

      forwardedProps.ref = ref;

      forwardedProps.style = generatedStyles;

      if (style) {
        // convert to styles array
        forwardedProps.style = [generatedStyles];

        if (Array.isArray(style)) {
          forwardedProps.style.push(...style);
        } else {
          forwardedProps.style.push(style);
        }
      }

      if (props.css) {
        if (!style) {
          // also convert to styles array
          forwardedProps.style = [generatedStyles];
        }

        forwardedProps.style.push(props.css);
      }

      return React.createElement(elementToBeCreated, forwardedProps);
    }

    WrappedStyledComponent = React.memo(
      React.forwardRef(StyledComponent),
      isEqual
    );

    WrappedStyledComponent.displayName = `StyledThing${Component.name}`;

    WrappedStyledComponent.isStyledComponent = true;

    WrappedStyledComponent.target = Component.isStyledComponent
      ? Component.target
      : Component;

    if (StyledComponentFactory.addedAttrs) {
      WrappedStyledComponent.attrs = Array.isArray(Component.attrs)
        ? Component.attrs.concat(StyledComponentFactory.addedAttrs)
        : [StyledComponentFactory.addedAttrs];
    } else {
      WrappedStyledComponent.attrs = Component.attrs;
    }

    WrappedStyledComponent.styles = Array.isArray(Component.styles)
      ? Component.styles.concat(styles)
      : [styles];

    if (Component.isStyledComponent && Component.shouldForwardProp) {
      const shouldForwardPropFn = Component.shouldForwardProp;

      if (StyledComponentFactory.shouldForwardProp) {
        const passedShouldForwardPropFn =
          StyledComponentFactory.shouldForwardProp;

        // compose nested shouldForwardProp calls
        shouldForwardProp = (prop, filterFn) =>
          shouldForwardPropFn(prop, filterFn) &&
          passedShouldForwardPropFn(prop, filterFn);
      } else {
        shouldForwardProp = shouldForwardPropFn;
      }
    }

    WrappedStyledComponent.shouldForwardProp = shouldForwardProp;

    hoist(WrappedStyledComponent, Component, {
      // all SC-specific things should not be hoisted
      attrs: true,
      displayName: true,
      isStyledComponent: true,
      shouldForwardProp: true,
      styles: true,
      target: true,
    });

    return WrappedStyledComponent;
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
