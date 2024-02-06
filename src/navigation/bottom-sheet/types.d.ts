import { BottomSheetProps } from '@gorhom/bottom-sheet';
import { BackdropPressBehavior } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import type {
  Descriptor,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  RouteProp,
  StackActionHelpers,
  StackNavigationState,
} from '@react-navigation/native';
import type { Animated } from 'react-native';

export type BottomSheetNavigationEventMap = {
  /**
   * Event which fires when a transition animation starts.
   */
  transitionStart: { data: { closing: boolean } };
  /**
   * Event which fires when a transition animation ends.
   */
  transitionEnd: { data: { closing: boolean } };
  /**
   * Event which fires when navigation gesture starts.
   */
  gestureStart: { data: undefined };
  /**
   * Event which fires when navigation gesture is completed.
   */
  gestureEnd: { data: undefined };
  /**
   * Event which fires when navigation gesture is canceled.
   */
  gestureCancel: { data: undefined };
};

export type BottomSheetNavigationHelpers = NavigationHelpers<ParamListBase, BottomSheetNavigationEventMap>;

export type BottomSheetNavigationProp<ParamList extends ParamListBase, RouteName extends keyof ParamList = string> = NavigationProp<
  ParamList,
  RouteName,
  StackNavigationState,
  BottomSheetNavigationOptions,
  BottomSheetNavigationEventMap
> &
  StackActionHelpers<ParamList>;

export type BottomSheetScreenProps<ParamList extends ParamListBase, RouteName extends keyof ParamList = string> = {
  navigation: BottomSheetNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
};

export type Layout = { width: number; height: number };

export type GestureDirection = 'horizontal' | 'horizontal-inverted' | 'vertical' | 'vertical-inverted';

export type Scene<T> = {
  /**
   * Current route object,
   */
  route: T;
  /**
   * Descriptor object for the route containing options and navigation object.
   */
  descriptor: BottomSheetDescriptor;
  /**
   * Animated nodes representing the progress of the animation.
   */
  progress: {
    /**
     * Progress value of the current screen.
     */
    current: Animated.AnimatedInterpolation;
    /**
     * Progress value for the screen after this one in the stack.
     * This can be `undefined` in case the screen animating is the last one.
     */
    next?: Animated.AnimatedInterpolation;
    /**
     * Progress value for the screen before this one in the stack.
     * This can be `undefined` in case the screen animating is the first one.
     */
    previous?: Animated.AnimatedInterpolation;
  };
};

export type BottomSheetDescriptor = Descriptor<ParamListBase, string, StackNavigationState, BottomSheetNavigationOptions> & {
  removing?: boolean;
};

export type BottomSheetDescriptorMap = {
  [key: string]: BottomSheetDescriptor;
};

export type BottomSheetNavigationOptions = Partial<
  Pick<
    BottomSheetProps,
    'index' | 'snapPoints' | 'animationDuration' | 'animationEasing' | 'enableContentPanningGesture' | 'enableHandlePanningGesture'
  >
> & {
  backdropOpacity?: number;
  backdropColor?: string;
  backdropPressBehavior?: BackdropPressBehavior;
  height?: number | string;
  offsetY?: number;
};

export type BottomSheetNavigationConfig = Record<string, unknown>;

export type TransitionSpec =
  | {
      animation: 'spring';
      config: Omit<Animated.SpringAnimationConfig, 'toValue' | keyof Animated.AnimationConfig>;
    }
  | {
      animation: 'timing';
      config: Omit<Animated.TimingAnimationConfig, 'toValue' | keyof Animated.AnimationConfig>;
    };

export type BottomSheetCardInterpolationProps = {
  /**
   * Values for the current screen.
   */
  current: {
    /**
     * Animated node representing the progress value of the current screen.
     */
    progress: Animated.AnimatedInterpolation;
  };
  /**
   * Values for the current screen the screen after this one in the stack.
   * This can be `undefined` in case the screen animating is the last one.
   */
  next?: {
    /**
     * Animated node representing the progress value of the next screen.
     */
    progress: Animated.AnimatedInterpolation;
  };
  /**
   * The index of the card in the stack.
   */
  index: number;
  /**
   * Animated node representing whether the card is closing (1 - closing, 0 - not closing).
   */
  closing: Animated.AnimatedInterpolation;
  /**
   * Animated node representing whether the card is being swiped (1 - swiping, 0 - not swiping).
   */
  swiping: Animated.AnimatedInterpolation;
  /**
   * Animated node representing multiplier when direction is inverted (-1 - inverted, 1 - normal).
   */
  inverted: Animated.AnimatedInterpolation;
  /**
   * Layout measurements for various items we use for animation.
   */
  layouts: {
    /**
     * Layout of the whole screen.
     */
    screen: Layout;
  };
  /**
   * Safe area insets
   */
  insets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type BottomSheetCardInterpolatedStyle = {
  /**
   * Interpolated style for the container view wrapping the card.
   */
  containerStyle?: any;
  /**
   * Interpolated style for the view representing the card.
   */
  cardStyle?: any;
  /**
   * Interpolated style for the view representing the semi-transparent overlay below the card.
   */
  overlayStyle?: any;
  /**
   * Interpolated style representing the card shadow.
   */
  shadowStyle?: any;
};

export type BottomSheetCardStyleInterpolator = (props: BottomSheetCardInterpolationProps) => BottomSheetCardInterpolatedStyle;

export type TransitionPreset = {
  /**
   * The direction of swipe gestures, `horizontal` or `vertical`.
   */
  gestureDirection: GestureDirection;
  /**
   * Object which specifies the animation type (timing or spring) and their options (such as duration for timing).
   */
  transitionSpec: {
    /**
     * Transition configuration when adding a screen.
     */
    open: TransitionSpec;
    /**
     * Transition configuration when removing a screen.
     */
    close: TransitionSpec;
  };
  /**
   * Function which specifies interpolated styles for various parts of the card, e.g. the overlay, shadow etc.
   */
  cardStyleInterpolator: BottomSheetCardStyleInterpolator;
};
