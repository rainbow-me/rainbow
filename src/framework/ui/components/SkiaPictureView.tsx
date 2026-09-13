import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { type SkPicture } from '@shopify/react-native-skia';

import '@shopify/react-native-skia/src/skia/NativeSetup';

import SkiaPictureViewNativeComponent from '@shopify/react-native-skia/src/specs/SkiaPictureViewNativeComponent';
import { SkiaViewApi } from '@shopify/react-native-skia/src/views/api';
import { SkiaViewNativeId } from '@shopify/react-native-skia/src/views/SkiaViewNativeId';
import { useStableValue } from '@storesjs/stores';
import Animated, { executeOnUIRuntimeSync, runOnUI, type AnimatedStyle } from 'react-native-reanimated';

export type SkiaPictureOutput = {
  nativeId: number | undefined;
  picture: SkPicture | undefined;
};

export type SkiaRenderer<T extends Disposable> = SkiaPictureOutput & {
  __workletContextObject: true;
  readonly deferred: boolean;
  manager: T | undefined;
};

type Disposable = { dispose(): void };

type Initializer<T extends Disposable> = (output: SkiaPictureOutput) => T;

type SkiaPictureViewProps<T extends Disposable, Style> = {
  onUpdate?: (manager: T) => void;
  renderer: SkiaRenderer<T>;
  style: StyleProp<Style>;
} & ({ initialize: Initializer<T>; prepare?: never } | { initialize?: never; prepare: () => Initializer<T> });

const AnimatedSkiaPictureViewNativeComponent = Animated.createAnimatedComponent(SkiaPictureViewNativeComponent);

/** Creates the UI-runtime state for one picture view. Construction and updates can be deferred. */
export function useSkiaRenderer<T extends Disposable>(options?: { deferred?: boolean }): SkiaRenderer<T> {
  return useStableValue<SkiaRenderer<T>>(() => ({
    __workletContextObject: true,
    deferred: options?.deferred ?? false,
    manager: undefined,
    nativeId: undefined,
    picture: undefined,
  }));
}

/** Publishes picture contents to an attached view. Undefined clears the image; the producer owns disposal. */
export function setSkiaPicture(output: SkiaPictureOutput, picture: SkPicture | undefined): void {
  'worklet';
  output.picture = picture;
  if (output.nativeId === undefined) return;

  SkiaViewApi.setJsiProperty(output.nativeId, 'picture', picture);
}

abstract class SkiaPictureViewBase<T extends Disposable, Style> extends React.PureComponent<SkiaPictureViewProps<T, Style>> {
  protected readonly nativeId: number;

  constructor(props: SkiaPictureViewProps<T, Style>) {
    super(props);
    this.nativeId = SkiaViewNativeId.current;
    SkiaViewNativeId.current += 1;
  }

  componentDidMount(): void {
    const renderer = this.props.renderer;
    const initialize = this.props.initialize ?? this.props.prepare();
    const nativeId = this.nativeId;

    const initializeOnUI = (): void => {
      'worklet';
      if (renderer.nativeId !== nativeId || renderer.manager) return;
      renderer.manager = initialize(renderer);
      if (!renderer.picture) setSkiaPicture(renderer, undefined);
    };

    executeOnUIRuntimeSync(() => {
      renderer.nativeId = nativeId;
      if (!renderer.deferred) initializeOnUI();
    })();

    if (renderer.deferred) runOnUI(initializeOnUI)();
  }

  componentDidUpdate(previous: SkiaPictureViewProps<T, Style>): void {
    const { onUpdate, renderer } = this.props;
    if (!onUpdate || onUpdate === previous.onUpdate) return;

    const updateOnUI = (): void => {
      'worklet';
      if (renderer.manager) onUpdate(renderer.manager);
    };

    if (renderer.deferred) runOnUI(updateOnUI)();
    else executeOnUIRuntimeSync(updateOnUI)();
  }

  componentWillUnmount(): void {
    const renderer = this.props.renderer;
    const nativeId = this.nativeId;

    executeOnUIRuntimeSync(() => {
      if (renderer.nativeId !== nativeId) return;
      renderer.nativeId = undefined;
      const manager = renderer.manager;
      renderer.manager = undefined;
      manager?.dispose();
      renderer.picture = undefined;
    })();
  }
}

/**
 * Owns a manager on the UI runtime and displays its pictures on one native surface. Provide
 * an `initializer` worklet directly, or return one from `prepare` after JS setup at mount.
 *
 * Memoized `onUpdate` worklets update the existing manager.
 */
export class SkiaPictureView<T extends Disposable> extends SkiaPictureViewBase<T, ViewStyle> {
  render(): React.JSX.Element {
    return <SkiaPictureViewNativeComponent collapsable={false} colorSpace="p3" nativeID={String(this.nativeId)} style={this.props.style} />;
  }
}

/**
 * Animated version of `SkiaPictureView` that retains the same manager lifecycle but allows
 * animated view styles.
 */
export class AnimatedSkiaPictureView<T extends Disposable> extends SkiaPictureViewBase<T, AnimatedStyle<ViewStyle>> {
  render(): React.JSX.Element {
    return (
      <AnimatedSkiaPictureViewNativeComponent
        collapsable={false}
        colorSpace="p3"
        nativeID={String(this.nativeId)}
        style={this.props.style}
      />
    );
  }
}
