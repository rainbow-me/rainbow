import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { ClipOp, Skia, TileMode, type SkCanvas, type SkColor, type SkParagraph } from '@shopify/react-native-skia';
import { useStableValue } from '@storesjs/stores';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedStyle,
  type DerivedValue,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Bleed, useColorMode } from '@/design-system';
import type { TextColor } from '@/design-system/color/palettes';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { useSkiaText, type TextSegment } from '@/design-system/components/SkiaText/useSkiaText';
import type { TextSize, TextWeight } from '@/design-system/components/Text/Text';
import { setSkiaPicture, SkiaPictureView, useSkiaRenderer, type SkiaPictureOutput } from '@/framework/ui/components/SkiaPictureView';

// ============ Types ========================================================== //

type SharedOrDerivedValue<T> = SharedValue<T> | DerivedValue<T>;

type SkiaAnimatedNumberProps = {
  backgroundColor: string;
  bleedHorizontal?: number;
  bleedVertical?: number;
  disableAnimations?: SharedOrDerivedValue<boolean> | boolean;
  exitMode?: ExitMode;
  /** Keep text on one line and scale wider values to fit the available width. */
  fitToWidth?: boolean;
  height?: number;
  /** Insets text layout and fitting while retaining the full drawing area. */
  paddingHorizontal?: number;
  position?: ViewStyle['position'];
  rollMode?: RollMode;
  value: string | SharedOrDerivedValue<string>;
  width: number | 'auto';

  // -- Text props
  align?: 'center' | 'left' | 'right';
  color?: TextColor | string | SharedOrDerivedValue<TextColor> | SharedOrDerivedValue<string>;
  size: StandardTextSize;
  tabularNumbers?: boolean;
  testID?: string;
  weight?: TextWeight;
} & ({ springConfig?: undefined; timingConfig?: WithTimingConfig } | { springConfig?: WithSpringConfig; timingConfig?: undefined });

export enum ExitMode {
  /** Characters exit in place, detaching from the text. */
  Dissolve = 'dissolve',
  /** Characters maintain their horizontal position relative to the remaining text. */
  SlideOut = 'slide-out',
}

export enum RollMode {
  Consistent = 'consistent',
  Nearest = 'nearest',
  /** Replace changed digits with blur/scale transitions, as in number entry. */
  None = 'none',
}

enum NumberPartType {
  Integer = 'integer',
  Prefix = 'prefix',
  Separator = 'separator',
  Suffix = 'suffix',
  Unknown = 'unknown',
}

/** The complete state for an animation from one string value to another. */
type AnimationState = {
  fromFitWidth: number;
  fromWidth: number;
  targetWidth: number;
  transitions: CharacterTransition[];
};

/** A snapshot of a character's visual properties at a single point in time. */
type CharacterState = {
  opacity: number;
  scale: number;
  width: number;
  x: number;
  /** Vertical offset for the digit roll animation. 0 for non-digits. */
  yOffset: number;
};

/** Defines the animation for a single character from a 'from' to a 'to' state. */
type CharacterTransition = {
  from: CharacterState;
  part: Part;
  to: CharacterState;
};

type Part = {
  index: number;
  key: string;
  type: NumberPartType;
  value: string;
};

type StandardTextSize = TextSize & `${number}pt`;

// ============ Constants ====================================================== //

const ANIMATION_PROGRESS_MAX = 100;
const BLEED_TO_TEXT_HEIGHT_RATIO = 0.5;
const EDGE_TO_DIGIT_HEIGHT_RATIO = 0.275;
const MIN_VISIBLE_OPACITY = 0.01;

const CHAR_CODE_ZERO = 48;
const CHAR_CODE_NINE = 57;
const MAX_CACHED_PARAGRAPHS = 20;
const EMPTY_PART: readonly Part[] = Object.freeze([]);

// ============ Worklets ======================================================= //

/**
 * Classifies a character by its role, returning its `NumberPartType`.
 */
function getPartType(char: string, isDigit: boolean, index: number, numChars: number): NumberPartType {
  'worklet';
  if (!isDigit) {
    if (char === '.' || char === ',') return NumberPartType.Separator;
    if (index === 0) return NumberPartType.Prefix;
    if (index === numChars - 1) return NumberPartType.Suffix;
    return NumberPartType.Unknown;
  }
  return NumberPartType.Integer;
}

function getParts(value: string, replaceDigits: boolean): readonly Part[] {
  'worklet';
  const numChars = value.length;
  if (numChars === 0) return EMPTY_PART;

  const parts: Part[] = new Array(numChars);
  let otherCharacterCounts: Record<string, number> | undefined;
  let digitsBefore = 0;

  for (let index = 0; index < numChars; index++) {
    const char = value[index];
    const charCode = value.charCodeAt(index);
    const isDigit = charCode >= CHAR_CODE_ZERO && charCode <= CHAR_CODE_NINE;

    const partType = getPartType(char, isDigit, index, numChars);
    let partKey: string;

    switch (partType) {
      case NumberPartType.Integer:
        partKey = replaceDigits ? `digit-${digitsBefore}-${char}` : `digit-${digitsBefore}`;
        digitsBefore += 1;
        break;
      case NumberPartType.Separator:
      case NumberPartType.Unknown: {
        const count = (otherCharacterCounts ??= {})[char] ?? 0;
        otherCharacterCounts[char] = count + 1;
        partKey = `${partType}-${char}-${count}`;
        break;
      }
      case NumberPartType.Prefix:
      case NumberPartType.Suffix:
        partKey = `${partType}-${char}`;
        break;
    }

    parts[index] = { index, key: partKey, type: partType, value: char };
  }

  return parts;
}

// ============ AnimatedNumberManager Class ==================================== //

class AnimatedNumberManager {
  private __workletClass = true;

  // -- Core State
  private paragraphCache = new Map<string, SkParagraph>();

  // -- Drawing Helpers
  private output: SkiaPictureOutput;
  private buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
  private paint = Skia.Paint();
  private pictureRecorder = Skia.PictureRecorder();

  // -- Settings
  private align: 'center' | 'left' | 'right';
  private animationConfig: { type: 'spring'; config: WithSpringConfig } | { type: 'timing'; config: WithTimingConfig };
  private exitMode: ExitMode;
  private fitToWidth: boolean;
  private height: number;
  private paddingHorizontal: number;
  private rollMode: RollMode;
  private width: number;

  // -- Shared Values
  private animationsDisabled: SharedOrDerivedValue<boolean>;
  private progress: SharedValue<number>;
  private textWidth: SharedValue<number> | undefined;

  // -- Text State
  private animationState: AnimationState | null = null;
  private currentLayout: { characters: Map<string, CharacterState & { part: Part }>; totalWidth: number } = {
    characters: new Map(),
    totalWidth: 0,
  };
  private digitHeight = 0;
  private lastValue: string;
  private lastColor: string;
  private textColor: SkColor;
  private visualStateMap = new Map<string, CharacterState & { part: Part }>();

  constructor({
    align,
    animationsDisabled,
    buildParagraph,
    exitMode,
    fitToWidth,
    height,
    output,
    paddingHorizontal,
    progress,
    rollMode,
    size,
    springConfig,
    timingConfig,
    textColor,
    textWidth,
    value,
    width,
  }: {
    align: 'center' | 'left' | 'right';
    animationsDisabled: SharedOrDerivedValue<boolean>;
    buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null;
    exitMode: ExitMode;
    fitToWidth: boolean;
    height: number;
    output: SkiaPictureOutput;
    paddingHorizontal: number;
    progress: SharedValue<number>;
    rollMode: RollMode;
    size: StandardTextSize;
    textColor: string;
    textWidth: SharedValue<number>;
    value: string;
    width: number | 'auto';
  } & ({ springConfig: WithSpringConfig; timingConfig?: undefined } | { springConfig?: undefined; timingConfig: WithTimingConfig })) {
    this.align = align;
    this.animationsDisabled = animationsDisabled;
    this.animationConfig = springConfig ? { type: 'spring', config: springConfig } : { type: 'timing', config: timingConfig };
    this.buildParagraph = buildParagraph;
    this.exitMode = exitMode;
    this.fitToWidth = fitToWidth && typeof width === 'number';
    this.height = height;
    this.lastValue = value;
    this.output = output;
    this.paddingHorizontal = paddingHorizontal;
    this.progress = progress;
    this.rollMode = rollMode;
    this.lastColor = textColor;
    this.textColor = Skia.Color(textColor);
    this.textWidth = width === 'auto' ? textWidth : undefined;
    this.width = width === 'auto' ? value.length * parseFloat(size) + paddingHorizontal * 2 : width;

    // -- Initial Build
    this.measureTextHeight();
    this.rebuildLayout();
    this.progress.addListener(0, current => {
      if (current !== 0) this.rebuildPicture();
    });
  }

  // ============ Private Helpers ============================================== //

  private rebuildLayout(): void {
    this.progress.value = 0;
    this.animationState = null;
    this.updateCurrentLayout();
    this.rebuildPicture();
  }

  /**
   * Measures the height of a digit '0' to use as a reference for text height.
   */
  private measureTextHeight(): void {
    const paragraph = this.buildParagraph({ text: '0', color: this.textColor });
    if (paragraph) {
      paragraph.layout(10);
      const rects = paragraph.getRectsForRange(0, 1);
      if (rects && rects.length) {
        this.digitHeight = rects[0].height;
      }
      paragraph.dispose();
    }
  }

  private getContentWidth(progress: number): number {
    if (!this.animationState) return this.currentLayout.totalWidth;
    const { fromWidth, targetWidth } = this.animationState;
    return Math.max(0, fromWidth + (targetWidth - fromWidth) * progress);
  }

  private getFitWidth(progress: number, contentWidth: number, availableWidth: number): number {
    if (!this.animationState) return Math.max(availableWidth, contentWidth);
    const { fromFitWidth, targetWidth } = this.animationState;
    const targetFitWidth = Math.max(availableWidth, targetWidth);
    return Math.max(availableWidth, contentWidth, fromFitWidth + (targetFitWidth - fromFitWidth) * progress);
  }

  /**
   * Captures the current, possibly interpolated, visual state.
   */
  private getVisualState(): {
    fitWidth: number;
    totalWidth: number;
    characters: Map<string, CharacterState & { part: Part }>;
  } {
    const visualStateMap = this.visualStateMap;
    visualStateMap.clear();

    const progress = this.animationState ? this.progress.value / ANIMATION_PROGRESS_MAX : 0;

    if (this.animationState) {
      for (const transition of this.animationState.transitions) {
        const part = transition.part;
        const from = transition.from;
        const to = transition.to;
        const opacity = from.opacity + (to.opacity - from.opacity) * progress;
        if (to.opacity === 0 && opacity < MIN_VISIBLE_OPACITY) continue;

        visualStateMap.set(part.key, {
          part,
          opacity,
          scale: from.scale + (to.scale - from.scale) * progress,
          width: from.width + (to.width - from.width) * progress,
          x: from.x + (to.x - from.x) * progress,
          yOffset: from.yOffset + (to.yOffset - from.yOffset) * progress,
        });
      }
    } else {
      for (const entry of this.currentLayout.characters.entries()) {
        const key = entry[0];
        const char = entry[1];
        visualStateMap.set(key, { ...char });
      }
    }

    const totalWidth = this.getContentWidth(progress);
    const availableWidth = Math.max(0, this.width - this.paddingHorizontal * 2);

    return { characters: visualStateMap, fitWidth: this.getFitWidth(progress, totalWidth, availableWidth), totalWidth };
  }

  private updateCurrentLayout(): number {
    const value = this.lastValue;
    const paragraph = value ? this.buildParagraph({ text: value, color: this.textColor }) : null;
    let removedIntegerCount = 0;

    if (!paragraph) {
      for (const character of this.currentLayout.characters.values()) {
        if (character.part.type === NumberPartType.Integer) removedIntegerCount += 1;
      }
      this.currentLayout.characters.clear();
      this.currentLayout.totalWidth = 0;
      return removedIntegerCount;
    }

    if (this.fitToWidth) {
      paragraph.layout(0);
      paragraph.layout(Math.ceil(paragraph.getMaxIntrinsicWidth()));
    } else paragraph.layout(Math.max(0, this.width - this.paddingHorizontal * 2));

    this.currentLayout.totalWidth = paragraph.getLongestLine();
    const parts = getParts(value, this.rollMode === RollMode.None);

    // -- Add new characters and update existing ones in place
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const rects = paragraph.getRectsForRange(i, i + 1);
      const rect = rects && rects.length > 0 ? rects[0] : { x: 0, width: 0 };
      const yOffset = part.type === NumberPartType.Integer ? -parseInt(part.value, 10) * this.digitHeight : 0;
      const existingChar = this.currentLayout.characters.get(part.key);

      if (existingChar) {
        existingChar.part = part;
        existingChar.opacity = 1;
        existingChar.scale = 1;
        existingChar.width = rect.width;
        existingChar.x = rect.x;
        existingChar.yOffset = yOffset;
      } else {
        this.currentLayout.characters.set(part.key, {
          opacity: 1,
          part,
          scale: 1,
          width: rect.width,
          x: rect.x,
          yOffset,
        });
      }
    }

    // -- Remove characters that are no longer present
    for (const character of this.currentLayout.characters.values()) {
      if (parts[character.part.index] !== character.part) {
        if (character.part.type === NumberPartType.Integer) removedIntegerCount += 1;
        this.currentLayout.characters.delete(character.part.key);
      }
    }

    return removedIntegerCount;
  }

  private createEnteringState(toChar: CharacterState & { part: Part }): CharacterState & { part: Part } {
    return {
      opacity: 0,
      part: toChar.part,
      scale: 0.8,
      width: toChar.width,
      x: toChar.x,
      yOffset: toChar.yOffset,
    };
  }

  private createExitingState(fromChar: CharacterState & { part: Part }, xOffset = 0): CharacterState {
    return {
      opacity: 0,
      scale: 0.8,
      width: fromChar.width,
      x: fromChar.x + xOffset,
      yOffset: fromChar.yOffset,
    };
  }

  private getPersistentCharacterToState(fromState: CharacterState, toState: CharacterState): CharacterState {
    if (this.rollMode !== RollMode.Nearest || fromState.yOffset === toState.yOffset) {
      return toState;
    }

    const fromValue = -fromState.yOffset / this.digitHeight;
    const toValue = -toState.yOffset / this.digitHeight;
    const distance = toValue - fromValue;

    let delta = distance % 10;
    if (Math.abs(delta) > 5) delta += delta > 0 ? -10 : 10;
    toState.yOffset = -(fromValue + delta) * this.digitHeight;

    return toState;
  }

  private getCachedParagraph(text: string, width: number): SkParagraph | null {
    let paragraph = this.paragraphCache.get(text);
    if (!paragraph) {
      const newParagraph = this.buildParagraph({ text, color: this.textColor });
      if (!newParagraph) return null;
      this.paragraphCache.set(text, newParagraph);
      paragraph = newParagraph;
    }
    paragraph.layout(width);
    return paragraph;
  }

  private pruneCache(): void {
    if (this.paragraphCache.size > MAX_CACHED_PARAGRAPHS) {
      const targetSize = Math.floor(MAX_CACHED_PARAGRAPHS / 2);
      const keysToDelete = this.paragraphCache.size - targetSize;
      const keys = this.paragraphCache.keys();

      for (let i = 0; i < keysToDelete; i++) {
        const key = keys.next().value;
        if (key) this.paragraphCache.delete(key);
      }
    }
  }

  private rebuildPicture(): void {
    const width = this.width;
    const padding = this.paddingHorizontal;
    const canvas = this.pictureRecorder.beginRecording({ height: this.height, width, x: 0, y: 0 });
    const y = (this.height - this.digitHeight) / 2;
    const progress = this.animationState ? this.progress.value / ANIMATION_PROGRESS_MAX : 0;

    if (this.fitToWidth || this.textWidth) {
      const contentWidth = this.getContentWidth(progress);

      if (this.textWidth) this.textWidth.value = contentWidth + padding * 2;
      else {
        const availableWidth = Math.max(0, width - padding * 2);
        const fitWidth = this.getFitWidth(progress, contentWidth, availableWidth);
        const fitScale = fitWidth > 0 ? availableWidth / fitWidth : 1;
        const remainingWidth = availableWidth - contentWidth * fitScale;
        const x = this.align === 'center' ? remainingWidth / 2 : this.align === 'right' ? remainingWidth : 0;

        canvas.translate(padding + x, (this.height * (1 - fitScale)) / 2);
        canvas.scale(fitScale, fitScale);
      }
    }

    if (!this.fitToWidth && padding) canvas.translate(padding, 0);

    const characterSource = this.animationState?.transitions ?? this.currentLayout.characters.values();
    let paintOpacity: number | undefined;

    for (const item of characterSource) {
      const isTransition = 'from' in item;
      const part = item.part;
      const from = isTransition ? item.from : item;
      const to = isTransition ? item.to : item;

      const opacity = from.opacity + (to.opacity - from.opacity) * progress;
      if (opacity < MIN_VISIBLE_OPACITY) continue;

      const scale = from.scale + (to.scale - from.scale) * progress;
      const x = from.x + (to.x - from.x) * progress;
      const width = from.width + (to.width - from.width) * progress;

      canvas.save();
      canvas.translate(x + ((1 - scale) * width) / 2, y + ((1 - scale) * this.digitHeight) / 2);

      const hasTransforms = scale !== 1 || opacity !== 1;
      if (hasTransforms) {
        canvas.scale(scale, scale);
        if (paintOpacity !== opacity) {
          paintOpacity = opacity;
          this.paint.setAlphaf(opacity);

          const blurAmount = (1 - opacity) * 7;
          this.paint.setImageFilter(blurAmount ? Skia.ImageFilter.MakeBlur(blurAmount, blurAmount, TileMode.Clamp, null) : null);
        }

        canvas.saveLayer(this.paint);
      }

      if (part.type === NumberPartType.Integer && this.rollMode !== RollMode.None) {
        const yOffset = from.yOffset + (to.yOffset - from.yOffset) * progress;
        this.drawDigitColumn(canvas, y, yOffset, width);
      } else {
        const paragraph = this.getCachedParagraph(part.value, width);
        if (paragraph) paragraph.paint(canvas, 0, 0);
      }

      if (hasTransforms) canvas.restore();
      canvas.restore();
    }

    setSkiaPicture(this.output, this.pictureRecorder.finishRecordingAsPicture());
  }

  private drawDigitColumn(canvas: SkCanvas, y: number, offset: number, width: number): void {
    const visibleTop = -y;
    const visibleBottom = visibleTop + this.height;
    const startDigit = Math.floor((visibleTop - offset) / this.digitHeight);
    const endDigit = Math.ceil((visibleBottom - offset) / this.digitHeight);

    canvas.save();
    canvas.clipRect({ x: -width, y: -y, width: width * 3, height: this.height }, ClipOp.Intersect, true);

    for (let pos = startDigit; pos <= endDigit; pos++) {
      const digit = ((pos % 10) + 10) % 10;
      const paragraph = this.getCachedParagraph(digit.toString(), width);
      if (paragraph) {
        canvas.save();
        canvas.translate(0, offset + pos * this.digitHeight);
        paragraph.paint(canvas, 0, 0);
        canvas.restore();
      }
    }

    canvas.restore();
  }

  // ============ Public Methods =============================================== //

  public setBuildParagraph(buildParagraph: (segments: TextSegment | TextSegment[]) => SkParagraph | null): void {
    this.buildParagraph = buildParagraph;
    for (const paragraph of this.paragraphCache.values()) paragraph.dispose();
    this.paragraphCache.clear();
    this.measureTextHeight();
    this.rebuildLayout();
  }

  public setValue(value: string, animate = true): void {
    if (value === this.lastValue) return;

    if (this.animationsDisabled.value || !animate) {
      this.lastValue = value;
      this.rebuildLayout();
      return;
    }

    this.lastValue = value;

    const previousState = this.getVisualState();
    this.progress.value = 0;

    // -- Process the layout update
    const removedIntegerCount = this.updateCurrentLayout();
    const targetState = this.currentLayout;

    const transitions = this.animationState?.transitions ?? [];
    if (transitions.length) transitions.length = 0;

    // -- Handle entering and updating characters
    for (const entry of targetState.characters.entries()) {
      const key = entry[0];
      const targetChar = entry[1];
      const previousChar = previousState.characters.get(key);
      if (previousChar) {
        transitions.push({ part: targetChar.part, from: previousChar, to: this.getPersistentCharacterToState(previousChar, targetChar) });
      } else {
        transitions.push({ part: targetChar.part, from: this.createEnteringState(targetChar), to: targetChar });
      }
    }

    // -- Handle exiting characters
    let exitMode = this.exitMode;
    if (
      this.align !== 'left' &&
      exitMode === ExitMode.SlideOut &&
      previousState.characters.size - targetState.characters.size > 2 &&
      removedIntegerCount > 2
    ) {
      exitMode = ExitMode.Dissolve;
    }

    // -- Create exit transitions
    for (const entry of previousState.characters.entries()) {
      const key = entry[0];
      if (!targetState.characters.has(key)) {
        const exitingChar = entry[1];
        let xShift = 0;

        switch (exitMode) {
          case ExitMode.Dissolve:
            break;
          case ExitMode.SlideOut: {
            // Find the nearest character that exists in both layouts to track movement
            let movement = 0;
            let foundAnchor = false;

            // First try to find a character that comes after the exiting one
            for (const transition of transitions) {
              const previousPos = previousState.characters.get(transition.part.key);
              if (previousPos && previousPos.x > exitingChar.x) {
                // This character was to the right of the exiting character
                movement = transition.to.x - transition.from.x;
                foundAnchor = true;
                break;
              }
            }

            // If no character after, look for one before
            if (!foundAnchor) {
              let nearestBefore: CharacterTransition | null = null;

              for (const transition of transitions) {
                const previousPos = previousState.characters.get(transition.part.key);
                if (previousPos && previousPos.x < exitingChar.x) {
                  const currentX = nearestBefore ? (previousState.characters.get(nearestBefore.part.key)?.x ?? 0) : 0;
                  if (!nearestBefore || previousPos.x > currentX) nearestBefore = transition;
                }
              }

              if (nearestBefore) {
                // Use the shift of the closest preceding character
                movement = nearestBefore.to.x - nearestBefore.from.x;
                // Account for its width change to maintain correct spacing
                movement += nearestBefore.to.width - nearestBefore.from.width;
              }
            }

            xShift = movement;
            break;
          }
        }

        transitions.push({ part: exitingChar.part, from: exitingChar, to: this.createExitingState(exitingChar, xShift) });
      }
    }

    if (!this.animationState) this.animationState = { fromFitWidth: 0, fromWidth: 0, targetWidth: 0, transitions: [] };
    this.animationState.fromFitWidth = previousState.fitWidth;
    this.animationState.fromWidth = previousState.totalWidth;
    this.animationState.targetWidth = targetState.totalWidth;
    this.animationState.transitions = transitions;

    if (transitions.length) {
      const animationConfig = this.animationConfig;

      const onFinish = (didComplete?: boolean): void => {
        if (!didComplete) return;
        this.progress.value = 0;
        this.animationState = null;
        this.pruneCache();
      };

      switch (animationConfig.type) {
        case 'spring':
          this.progress.value = withSpring(ANIMATION_PROGRESS_MAX, animationConfig.config, onFinish);
          break;
        case 'timing':
          this.progress.value = withTiming(ANIMATION_PROGRESS_MAX, animationConfig.config, onFinish);
          break;
      }
    } else {
      this.rebuildPicture();
    }
  }

  public updateTextColor(textColor: string): void {
    if (textColor === this.lastColor) return;
    this.paragraphCache.clear();
    this.lastColor = textColor;
    this.textColor = Skia.Color(textColor);
    this.rebuildPicture();
  }

  public dispose(): void {
    this.progress.removeListener(0);
    cancelAnimation(this.progress);
    this.pictureRecorder.dispose();

    for (const p of this.paragraphCache.values()) p.dispose();
    this.paragraphCache.clear();
  }
}

// ============ SkiaAnimatedNumber Component =================================== //

export const SkiaAnimatedNumber = memo(function SkiaAnimatedNumber({
  align = 'left',
  backgroundColor = 'white',
  bleedHorizontal: providedHorizontalBleed,
  bleedVertical: providedVerticalBleed,
  color = 'label',
  disableAnimations = false,
  exitMode = ExitMode.SlideOut,
  fitToWidth = false,
  height: providedHeight,
  paddingHorizontal = 0,
  position = 'relative',
  rollMode = RollMode.Consistent,
  size,
  springConfig,
  tabularNumbers = false,
  testID,
  timingConfig,
  value,
  weight = 'bold',
  width,
}: SkiaAnimatedNumberProps) {
  const { colorMode } = useColorMode();
  const buildParagraph = useSkiaText({ align, color: 'label', halfLeading: true, size, tabularNumbers, weight });

  const { height, horizontalBleed, verticalBleed } = getLayoutInfo({
    providedHeight,
    providedHorizontalBleed,
    providedVerticalBleed,
    size,
    width,
  });

  const progress = useSharedValue(0);
  const textWidth = useSharedValue(0);

  const canvasWidth = width === 'auto' ? 300 + paddingHorizontal * 2 : width;
  const disableAnimationsIsBoolean = typeof disableAnimations === 'boolean';
  const valueIsString = typeof value === 'string';

  const animationsDisabled = useDerivedValue(() => (disableAnimationsIsBoolean ? disableAnimations : disableAnimations.value));
  const currentValue = useDerivedValue(() => (valueIsString ? value : value.value));
  const currentColor = useDerivedValue(() => getColorForTheme(color, colorMode));

  const renderer = useSkiaRenderer<AnimatedNumberManager>();

  const config = useStableValue(() => ({
    align,
    animationsDisabled,
    exitMode,
    fitToWidth,
    height,
    paddingHorizontal,
    progress,
    rollMode,
    size,
    ...(timingConfig ? { timingConfig } : { springConfig: springConfig ?? SPRING_CONFIGS.softerSpringConfig }),
    textWidth,
    width,
  }));

  const widthStyle = useAnimatedStyle(() => ({ width: textWidth.value }));

  const updateParagraphBuilder = useCallback(
    (manager: AnimatedNumberManager) => {
      'worklet';
      manager.setBuildParagraph(buildParagraph);
    },
    [buildParagraph]
  );

  useAnimatedReaction(
    () => currentColor.value,
    (current, previous) => {
      if (current === previous) return;
      renderer.manager?.updateTextColor(current);
    },
    []
  );

  useAnimatedReaction(
    () => currentValue.value,
    (current, previous) => {
      if (current === previous) return;
      renderer.manager?.setValue(current, previous !== null);
    },
    []
  );

  return (
    <AnimatedNumberWrapper
      align={align}
      backgroundColor={backgroundColor}
      currentValue={currentValue}
      height={height}
      horizontalBleed={horizontalBleed}
      position={position}
      size={size}
      testID={testID}
      verticalBleed={verticalBleed}
      width={width}
      widthStyle={width === 'auto' ? widthStyle : undefined}
    >
      {useMemo(
        () => (
          <SkiaPictureView
            initialize={output => {
              'worklet';
              return new AnimatedNumberManager({
                ...config,
                buildParagraph,
                output,
                textColor: currentColor.value,
                value: currentValue.value,
              });
            }}
            onUpdate={updateParagraphBuilder}
            renderer={renderer}
            style={{ height, width: canvasWidth }}
          />
        ),
        [buildParagraph, canvasWidth, config, currentColor, currentValue, height, renderer, updateParagraphBuilder]
      )}
    </AnimatedNumberWrapper>
  );
});

export const EdgeGradients = memo(function EdgeGradients({ color, size }: { color: string; size: StandardTextSize }) {
  const edgeSize = getHeightForTextSize(size) * EDGE_TO_DIGIT_HEIGHT_RATIO;
  const edgeSizes = { horizontal: edgeSize, vertical: edgeSize };

  return (
    <View style={StyleSheet.absoluteFill}>
      <EasingGradient
        endColor={color}
        endOpacity={0}
        endPosition="bottom"
        startColor={color}
        startOpacity={1}
        startPosition="top"
        style={{ height: edgeSizes.vertical, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
      <EasingGradient
        endColor={color}
        endOpacity={0}
        endPosition="top"
        startColor={color}
        startOpacity={1}
        startPosition="bottom"
        style={{ bottom: 0, height: edgeSizes.vertical, left: 0, position: 'absolute', right: 0 }}
      />
    </View>
  );
});

type AnimatedNumberWrapperProps = {
  align: 'center' | 'left' | 'right';
  backgroundColor: string;
  children: React.ReactNode;
  currentValue: DerivedValue<string>;
  height: number;
  horizontalBleed: number;
  position: ViewStyle['position'];
  size: StandardTextSize;
  testID?: string;
  verticalBleed: number;
  width: number | 'auto';
  widthStyle?: AnimatedStyle;
};

const AnimatedNumberWrapper = ({
  align,
  backgroundColor,
  children,
  currentValue,
  height,
  horizontalBleed,
  position,
  size,
  testID,
  verticalBleed,
  width,
  widthStyle,
}: AnimatedNumberWrapperProps) => {
  const accessibilityProps = useAnimatedProps<ViewProps>(() => ({ accessibilityLabel: currentValue.value }));

  return (
    <Bleed horizontal={{ custom: horizontalBleed }} vertical={{ custom: verticalBleed }}>
      <Animated.View
        accessible
        animatedProps={accessibilityProps}
        accessibilityRole="text"
        testID={testID}
        style={[
          {
            height,
            overflow: 'visible',
            position,
            width: width === 'auto' ? undefined : width,
            ...getContainerStyles({ align, horizontalBleed, position, verticalBleed }),
          },
          widthStyle,
        ]}
      >
        {children}
        <EdgeGradients color={backgroundColor} size={size} />
      </Animated.View>
    </Bleed>
  );
};

function getHeightForTextSize(size: StandardTextSize): number {
  switch (size) {
    case '76pt':
      return 54;
    case '64pt':
      return 45;
    case '54pt':
      return 38;
    case '44pt':
      return 31;
    case '34pt':
      return 24;
    case '30pt':
      return 21;
    case '26pt':
      return 18;
    case '22pt':
      return 16;
    case '20pt':
      return 14;
    case '17pt':
      return 12;
    case '15pt':
      return 11;
    case '13pt':
      return 9;
    case '12pt':
      return 8;
    case '11pt':
      return 8;
    case '10pt':
      return 7;
  }
}

function getLayoutInfo({
  providedHeight,
  providedHorizontalBleed,
  providedVerticalBleed,
  size,
  width,
}: {
  providedHeight: number | undefined;
  providedHorizontalBleed: number | undefined;
  providedVerticalBleed: number | undefined;
  size: StandardTextSize;
  width: number | 'auto';
}): { height: number; horizontalBleed: number; verticalBleed: number } {
  const textHeight = providedHeight ?? getHeightForTextSize(size);
  const horizontalBleed = providedHorizontalBleed ?? (width === 'auto' ? 0 : textHeight * BLEED_TO_TEXT_HEIGHT_RATIO);
  const verticalBleed = providedVerticalBleed ?? textHeight * BLEED_TO_TEXT_HEIGHT_RATIO;
  const height = textHeight + verticalBleed * 2;

  return { height, horizontalBleed, verticalBleed };
}

function getContainerStyles({
  align,
  horizontalBleed,
  position,
  verticalBleed,
}: {
  align: 'center' | 'left' | 'right';
  horizontalBleed: number;
  position: ViewStyle['position'];
  verticalBleed: number;
}): ViewStyle {
  const styles: ViewStyle = {};

  styles.justifyContent = 'center';
  styles.paddingHorizontal = horizontalBleed;
  styles.paddingVertical = verticalBleed;

  if (position === 'absolute') {
    styles.bottom = 0;
    styles.top = 0;
  }

  switch (align) {
    case 'center':
      styles.alignItems = 'center';
      if (position === 'absolute') {
        styles.left = 0;
        styles.right = 0;
      }
      break;

    case 'left':
      styles.alignItems = 'flex-start';
      if (position === 'absolute') styles.left = 0;
      break;

    case 'right':
      styles.alignItems = 'flex-end';
      if (position === 'absolute') styles.right = 0;
      break;
  }

  return styles;
}
