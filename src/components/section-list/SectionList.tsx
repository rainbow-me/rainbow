import React, { useMemo, useRef, forwardRef, useImperativeHandle, useEffect, useId } from 'react';
import { FlashList, FlashListProps } from '@shopify/flash-list';

/**
 * Very small wrapper that mimics the React-Native SectionList API while
 * delegating all the heavy-lifting to FlashList under the hood.
 *
 * The public API purposefully stays close to SectionList so we can migrate
 * existing screens with (ideally) a single import change.
 */

export interface SectionBase<ItemT> {
  /** Title or any metadata you require */
  title?: string;
  /** The actual items rendered in the section */
  data: ItemT[];
  /** Any extra user-land data */
  [key: string]: unknown;
}

/**
 * Internal discriminator identifying the kind of flattened node we are dealing
 * with once the section structure has been transformed into a flat array that
 * FlashList can consume.
 */
const enum FlatItemType {
  HEADER = 'SECTION_HEADER',
  ITEM = 'ROW',
  FOOTER = 'SECTION_FOOTER',
}

export type SectionListRenderItemInfo<ItemT, SectionT extends SectionBase<ItemT>> = {
  item: ItemT;
  index: number; // index **within** the section
  section: SectionT;
};

export interface SectionListProps<ItemT, SectionT extends SectionBase<ItemT>>
  extends Omit<FlashListProps<any>, 'data' | 'renderItem' | 'estimatedItemSize'> {
  /** Array of sections */
  sections: SectionT[];
  /** Render a single row (optional if each section supplies its own `renderItem`) */
  renderItem?: (info: SectionListRenderItemInfo<ItemT, SectionT>) => React.ReactElement | null;
  /** Render the header for a section */
  renderSectionHeader?: (info: { section: SectionT }) => React.ReactElement | null;
  /** Render a footer for a section */
  renderSectionFooter?: (info: { section: SectionT }) => React.ReactElement | null;
  /** Extract a unique key for the given row */
  keyExtractor?: (item: ItemT, index: number) => string;
  /** Estimated height (or width) for a single row. Required by FlashList */
  estimatedItemSize: number;
  /** Optional component rendered at the end of the list */
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  /** Number of rows to render on initial mount (kept for RN-compat). Ignored by FlashList. */
  initialNumToRender?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type HeaderObject<ItemT, SectionT> = {
  __type: FlatItemType.HEADER;
  section: SectionT;
};

type FooterObject<ItemT, SectionT> = {
  __type: FlatItemType.FOOTER;
  section: SectionT;
};

type RowObject<ItemT, SectionT> = {
  __type: FlatItemType.ITEM;
  section: SectionT;
  item: ItemT;
  indexInSection: number;
};

type FlatListItem<ItemT, SectionT> = HeaderObject<ItemT, SectionT> | FooterObject<ItemT, SectionT> | RowObject<ItemT, SectionT>;

function isHeader<ItemT, SectionT>(item: FlatListItem<ItemT, SectionT>): item is HeaderObject<ItemT, SectionT> {
  return item.__type === FlatItemType.HEADER;
}

function isFooter<ItemT, SectionT>(item: FlatListItem<ItemT, SectionT>): item is FooterObject<ItemT, SectionT> {
  return item.__type === FlatItemType.FOOTER;
}

function isRow<ItemT, SectionT>(item: FlatListItem<ItemT, SectionT>): item is RowObject<ItemT, SectionT> {
  return item.__type === FlatItemType.ITEM;
}

/**
 * Flatten the regular SectionList data-shape into a single array consumable by
 * FlashList. We interleave headers / footers in between section items while
 * keeping enough metadata to reconstruct original callbacks.
 */
function flattenSections<ItemT, SectionT extends SectionBase<ItemT>>(
  sections: SectionT[],
  includeFooter: boolean
): {
  flatData: FlatListItem<ItemT, SectionT>[];
  stickyHeaderIndices: number[];
  headerStartIndices: number[]; // index of each header, useful for scrollToLocation
} {
  const flatData: FlatListItem<ItemT, SectionT>[] = [];
  const stickyHeaderIndices: number[] = [];
  const headerStartIndices: number[] = [];

  sections.forEach(section => {
    // Header first
    headerStartIndices.push(flatData.length);
    stickyHeaderIndices.push(flatData.length);
    flatData.push({ __type: FlatItemType.HEADER, section } as HeaderObject<ItemT, SectionT>);

    // Rows
    section.data.forEach((item, idx) => {
      flatData.push({
        __type: FlatItemType.ITEM,
        section,
        item,
        indexInSection: idx,
      } as RowObject<ItemT, SectionT>);
    });

    if (includeFooter) {
      flatData.push({ __type: FlatItemType.FOOTER, section } as FooterObject<ItemT, SectionT>);
    }
  });

  return { flatData, stickyHeaderIndices, headerStartIndices };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A drop-in replacement for React-Native's SectionList powered by FlashList.
 *
 * NOTE: If you rely on extremely SectionList specific functionality that isn't
 * covered here, we can extend this API on demand.
 */
function InternalSectionList<ItemT, SectionT extends SectionBase<ItemT>>(
  {
    sections,
    renderItem,
    renderSectionHeader,
    renderSectionFooter,
    keyExtractor,
    estimatedItemSize,
    ListFooterComponent,
    ...restProps
  }: SectionListProps<ItemT, SectionT>,
  ref: React.Ref<any>
) {
  const includeFooter = typeof renderSectionFooter === 'function';

  const { flatData, stickyHeaderIndices, headerStartIndices } = useMemo(
    () => flattenSections<ItemT, SectionT>(sections, includeFooter),
    [sections, includeFooter]
  );

  const flashListRef = useRef<FlashList<FlatListItem<ItemT, SectionT>>>(null);

  // Internal renderItem that delegates back to the consumer
  const renderFlatItem: FlashListProps<FlatListItem<ItemT, SectionT>>['renderItem'] = ({ item }) => {
    if (isHeader(item)) {
      return renderSectionHeader ? renderSectionHeader({ section: item.section }) : null;
    }
    if (isFooter(item)) {
      return renderSectionFooter ? renderSectionFooter({ section: item.section }) : null;
    }
    // Row
    if (renderItem) {
      return renderItem({ item: item.item, index: item.indexInSection, section: item.section });
    }
    // Fallback to per-section renderer
    if (typeof item.section.renderItem === 'function') {
      return item.section.renderItem({ item: item.item, index: item.indexInSection, section: item.section });
    }
    return null;
  };

  // For better perf, let FlashList know what kind of cell we are rendering
  const getItemType = (item: FlatListItem<ItemT, SectionT>) => {
    return item.__type;
  };

  console.log('WTFFF', useId());

  // Forward an imperative handle that exposes scrollToLocation so that existing
  // code expecting a SectionList ref keeps working.
  useImperativeHandle(
    ref,
    () => {
      console.log('REDO IMPERACTIVE HANDLE', headerStartIndices, sections.length);
      return {
        /** Mimic SectionList.scrollToLocation */
        scrollToLocation: ({
          animated = true,
          itemIndex,
          sectionIndex,
          viewPosition,
          viewOffset,
        }: {
          animated?: boolean;
          itemIndex: number;
          sectionIndex: number;
          viewPosition?: number;
          viewOffset?: number;
        }) => {
          const headerFlatIndex = headerStartIndices[sectionIndex];
          if (headerFlatIndex == null) return;
          // +1 because the first element after the header is the 0th row in the section
          const flatIndex = headerFlatIndex + 1 + itemIndex;
          flashListRef.current?.scrollToIndex({ animated, index: flatIndex, viewOffset, viewPosition });
        },
        /** Expose props so external helpers (e.g. scroll-to-top) can introspect */
        props: { sections },
        /** Pass-through to underlying FlashList */
        scrollToOffset: (params: { animated?: boolean; offset: number }) => {
          flashListRef.current?.scrollToOffset(params);
        },
      };
    },
    []
    // [JSON.stringify(headerStartIndices), sections.length]
  );

  console.log('render list', flatData.length);
  useEffect(() => {
    console.log('flatData', flatData.length);
  }, [flatData]);

  return (
    <FlashList
      ref={flashListRef}
      data={flatData}
      renderItem={renderFlatItem}
      keyExtractor={(item, index) => {
        if (isRow(item)) {
          return keyExtractor ? keyExtractor(item.item, item.indexInSection) : String(index);
        }
        // Header / footer need stable keys as well
        return `__${item.__type}_${index}`;
      }}
      stickyHeaderIndices={stickyHeaderIndices}
      getItemType={getItemType}
      estimatedItemSize={estimatedItemSize}
      ListFooterComponent={ListFooterComponent}
      // Spread any additional FlashList props the consumer provided
      {...restProps}
    />
  );
}

const SectionList = forwardRef(InternalSectionList) as <ItemT, SectionT extends SectionBase<ItemT>>(
  props: SectionListProps<ItemT, SectionT> & { ref?: React.Ref<any> }
) => React.ReactElement;

export default SectionList;

export type SectionListRef<ItemT, SectionT extends SectionBase<ItemT>> = {
  scrollToLocation: (params: {
    animated?: boolean;
    itemIndex: number;
    sectionIndex: number;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  scrollToOffset: (params: { animated?: boolean; offset: number }) => void;
  props: { sections: SectionT[] };
};

// For unit-tests / debugging
export const _private = { flattenSections };
