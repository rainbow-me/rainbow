import {
  DataModule,
  FontWeight,
  SkFontMgr,
  SkParagraphBuilder,
  SkTypefaceFontProvider,
  Skia,
  TextAlign as SkiaTextAlign,
} from '@shopify/react-native-skia';
import { Platform } from '@shopify/react-native-skia/src/Platform';
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import { TextAlign } from '@/components/text/types';
import { TextWeight } from '@/design-system/components/Text/Text';
import { IS_DEV, IS_IOS } from '@/env';
import { useCleanup } from '@/hooks/useCleanup';

interface FontManager {
  fontManager: SkFontMgr | SkTypefaceFontProvider;
  paragraphBuilder: SkParagraphBuilder | null;
}

interface FontInfo {
  prevWeights: Set<TextWeight>;
  textAlign: TextAlign;
}

/**
 * [Android] Lazy font loaders (iOS uses Skia's system font manager)
 */
const FONT_LOADERS: Record<TextWeight, () => DataModule> = {
  regular: () => require('@/assets/fonts/SF-Pro-Rounded-Regular.otf'),
  medium: () => require('@/assets/fonts/SF-Pro-Rounded-Medium.otf'),
  semibold: () => require('@/assets/fonts/SF-Pro-Rounded-Semibold.otf'),
  bold: () => require('@/assets/fonts/SF-Pro-Rounded-Bold.otf'),
  heavy: () => require('@/assets/fonts/SF-Pro-Rounded-Heavy.otf'),
  black: () => require('@/assets/fonts/SF-Pro-Rounded-Black.otf'),
};

/**
 * Internal hook for getting memory-managed Skia font managers and paragraph builders.
 * - On iOS: Uses Skia's system font manager (`SkFontMgr`).
 * - On Android: Uses a global `SkTypefaceFontProvider` that lazily loads required weights.
 *
 * @param align - Desired text alignment
 * @param weight - Primary text weight to load
 * @param additionalWeights - Any extra weights needed
 * @returns An object containing a fontManager and paragraphBuilder
 */
export function useSkiaFontManager(align: TextAlign, weight: TextWeight, additionalWeights: TextWeight[] = []): FontManager {
  const [initialFontInfo] = useState<FontInfo>(() => ({
    prevWeights: IS_IOS ? new Set([weight, ...additionalWeights]) : new Set(),
    textAlign: align,
  }));

  const [manager, setManager] = useState<FontManager>(() => getInitialFontManager(initialFontInfo.textAlign));
  const fontInfoRef = useRef(initialFontInfo);

  // ============ [iOS] Handle align prop changes ============================== //
  useEffect(() => {
    if (!IS_IOS || align === fontInfoRef.current.textAlign) return;
    setManager(prev => ({ fontManager: prev.fontManager, paragraphBuilder: getParagraphBuilder(align) }));
    releaseParagraphBuilder(fontInfoRef);
    fontInfoRef.current.textAlign = align;
  }, [align]);

  // ============ [Android] Handle align and weight prop changes =============== //
  useEffect(() => {
    if (IS_IOS || !isAndroidFontManager(manager)) return;
    handleAndroidFontChanges({ additionalWeights, align, fontInfoRef, manager, setManager, weight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [align, weight, ...additionalWeights]);

  useCleanup(() => {
    releaseParagraphBuilder(fontInfoRef);
    releaseFontManager();
  });

  return manager;
}

interface AndroidFontManager extends FontManager {
  fontManager: SkTypefaceFontProvider;
}

/**
 * Type check to delineate between iOS and Android font managers.
 * - iOS: Uses the system font manager (`SkFontMgr`)
 * - Android: Uses a custom typeface provider (`SkTypefaceFontProvider`)
 */
function isAndroidFontManager(
  manager: FontManager | SkFontMgr | SkTypefaceFontProvider
): manager is AndroidFontManager | SkTypefaceFontProvider {
  const isTypefaceProvider = 'registerFont' in manager || ('fontManager' in manager && 'registerFont' in manager.fontManager);
  return isTypefaceProvider;
}

/**
 * [Android] Helper that handles dynamic font loading and alignment changes.
 */
function handleAndroidFontChanges({
  additionalWeights,
  align,
  fontInfoRef,
  manager,
  setManager,
  weight,
}: {
  additionalWeights: TextWeight[];
  align: TextAlign;
  fontInfoRef: MutableRefObject<{
    prevWeights: Set<TextWeight>;
    textAlign: TextAlign;
  }>;
  manager: AndroidFontManager;
  setManager: Dispatch<SetStateAction<FontManager>>;
  weight: TextWeight;
}) {
  const prevWeights = fontInfoRef.current.prevWeights;
  const nextWeights = new Set([weight, ...additionalWeights]);
  const addedWeights = new Set([...nextWeights].filter(w => !prevWeights.has(w)));

  fontInfoRef.current.prevWeights = nextWeights;

  // Load any newly required weights
  Promise.all(Array.from(addedWeights).map(w => getTypeface(manager.fontManager, w))).then(() => {
    setManager(prev => {
      // Dispose previous paragraph builder and replace with the new one
      prev.paragraphBuilder?.dispose?.();
      return {
        fontManager: prev.fontManager,
        paragraphBuilder: Skia.ParagraphBuilder.Make({ textAlign: getSkiaTextAlign(align) }, manager.fontManager),
      };
    });
  });
}

// ============ Lazy-Loaded Global Font Manager ================================ //

interface RegisteredTypeface {
  promise: Promise<void>;
}

let _fontManager: SkFontMgr | SkTypefaceFontProvider | null | undefined;
let _fontManagerRefsCount: number | undefined;
let _paragraphBuilders: Map<TextAlign, { builder: SkParagraphBuilder; refCount: number }> | undefined;
let _typefaceRegistry: Map<TextWeight, RegisteredTypeface> | undefined;

/**
 * Provides an initial `FontManager` to the `useSkiaFontManager` hook.
 *
 * [iOS] Returns a system font manager and a paragraph builder for the specified alignment
 * [Android] Returns a typeface font provider and a null initial paragraph builder
 * @param textAlign - The desired text alignment
 */
function getInitialFontManager(textAlign: TextAlign): FontManager {
  incrementFontManagerRefs();
  if (!getGlobalFontManager()) setGlobalFontManager(Skia.FontMgr.System());
  return {
    fontManager: getGlobalFontManager(),
    paragraphBuilder: IS_IOS ? getParagraphBuilder(textAlign) : null,
  };
}

/**
 * Returns the current global font manager.
 */
function getGlobalFontManager(): SkFontMgr | SkTypefaceFontProvider {
  if (!_fontManager) _fontManager = IS_IOS ? Skia.FontMgr.System() : Skia.TypefaceFontProvider.Make();
  return _fontManager;
}

/**
 * Sets the global font manager to the given value.
 */
function setGlobalFontManager(value: SkFontMgr | SkTypefaceFontProvider | null): void {
  _fontManager = value;
}

/**
 * [iOS only]
 * Returns the global map of paragraph builders, creating it if not yet initialized.
 * Each entry holds a builder instance and its reference count. A maximum of one builder
 * per text alignment is kept in memory.
 */
function getParagraphBuilders(): Map<TextAlign, { builder: SkParagraphBuilder; refCount: number }> {
  if (!_paragraphBuilders) _paragraphBuilders = new Map();
  return _paragraphBuilders;
}

/**
 * [Android only]
 * Returns the global typeface registry, creating it if not yet initialized.
 * This map tracks each font weight's Promise and reference count.
 */
function getTypefaceRegistry(): Map<TextWeight, RegisteredTypeface> {
  if (!_typefaceRegistry) _typefaceRegistry = new Map();
  return _typefaceRegistry;
}

/**
 * Increments the global font manager reference count.
 * @returns The new reference count
 */
function incrementFontManagerRefs(): number {
  if (_fontManagerRefsCount === undefined) _fontManagerRefsCount = 0;
  _fontManagerRefsCount += 1;
  return _fontManagerRefsCount;
}

/**
 * Decrements the global font manager reference count.
 * @returns The new reference count
 */
function decrementFontManagerRefs(): number {
  if (_fontManagerRefsCount !== undefined && _fontManagerRefsCount > 0) {
    _fontManagerRefsCount -= 1;
    return _fontManagerRefsCount;
  }
  return 0;
}

/**
 * [Android only]
 * Acquires a typeface for the given weight, incrementing refCount if it exists, or loading it asynchronously otherwise.
 * @param weight - The font weight to load or reference
 * @returns A Promise resolving to the SkTypeface (or null if loading fails)
 */
function getTypeface(fontManager: SkTypefaceFontProvider, weight: TextWeight): Promise<void> {
  const existing = getTypefaceRegistry().get(weight);
  if (existing) return existing.promise;

  // Create a new promise for loading the typeface
  const loadPromise = Skia.Data.fromURI(Platform.resolveAsset(FONT_LOADERS[weight]?.()))
    .then(data => {
      const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);
      if (!typeface) return;
      fontManager.registerFont(typeface, `SFProRounded-${weight}`);
    })
    .catch(error => {
      if (IS_DEV) console.log(`[useSkiaFontManager]: Failed to load typeface: ${weight}`, error);
      return;
    });
  // Store the promise to coalesce simultaneous requests
  getTypefaceRegistry().set(weight, { promise: loadPromise });
  return loadPromise;
}

/**
 * [iOS only]
 * Returns (and ref-counts) an existing paragraph builder for the specified alignment,
 * or creates a new builder if one doesn't already exist.
 * @param textAlign - The desired Skia text alignment
 */
function getParagraphBuilder(textAlign: TextAlign): SkParagraphBuilder {
  const existing = getParagraphBuilders().get(textAlign);
  if (existing) {
    existing.refCount += 1;
    return existing.builder;
  }
  const newBuilder = Skia.ParagraphBuilder.Make({ textAlign: getSkiaTextAlign(textAlign) });
  getParagraphBuilders().set(textAlign, { builder: newBuilder, refCount: 1 });
  return newBuilder;
}

/**
 * [iOS only]
 * Decrements the refCount for the paragraph builder matching the given alignment.
 * If the count drops to zero, the builder is disposed and removed from the cache.
 * @param fontInfoRef - The font info ref to release the paragraph builder for
 */
function releaseParagraphBuilder(fontInfoRef: MutableRefObject<FontInfo>): void {
  if (!IS_IOS) return;
  const existing = getParagraphBuilders().get(fontInfoRef.current.textAlign);
  if (existing) {
    existing.refCount -= 1;
    if (existing.refCount <= 0) {
      existing.builder?.dispose?.();
      getParagraphBuilders().delete(fontInfoRef.current.textAlign);
    }
  }
}

/**
 * Decrements the global font manager ref count, disposing the manager
 * and clearing all lazy caches if the count drops to zero.
 */
function releaseFontManager(): void {
  const newCount = decrementFontManagerRefs();
  if (newCount <= 0) {
    // In the unlikely event that nothing is in use, reset to free all memory
    _fontManager?.dispose?.();
    _fontManager = null;
    _fontManagerRefsCount = undefined;
    _paragraphBuilders = undefined;
    _typefaceRegistry = undefined;
  }
}

// ============ Skia Text Style Helpers ======================================= //

/**
 * Maps a TextWeight to the corresponding Skia FontWeight constant.
 * @param weight - A valid TextWeight
 * @returns The Skia FontWeight equivalent
 */
export function getSkiaFontWeight(weight: TextWeight): FontWeight {
  'worklet';
  switch (weight) {
    case 'regular':
      return FontWeight.Normal;
    case 'medium':
      return FontWeight.Medium;
    case 'semibold':
      return FontWeight.SemiBold;
    case 'bold':
      return FontWeight.Bold;
    case 'heavy':
      return FontWeight.ExtraBold;
    case 'black':
      return FontWeight.Black;
  }
}

/**
 * Maps a custom TextAlign enum to the corresponding Skia TextAlign constant.
 * @param textAlign - A TextAlign value
 * @returns The Skia TextAlign equivalent
 */
export function getSkiaTextAlign(textAlign: TextAlign): SkiaTextAlign {
  'worklet';
  switch (textAlign) {
    case 'auto':
    case 'left':
      return SkiaTextAlign.Left;
    case 'right':
      return SkiaTextAlign.Right;
    case 'center':
      return SkiaTextAlign.Center;
    case 'justify':
      return SkiaTextAlign.Justify;
  }
}
