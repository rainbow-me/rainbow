import React, { ComponentProps, createRef, RefObject } from 'react';
import { createRainbowStore } from '../internal/createRainbowStore';
import { BottomSheetModal, BottomSheetModalProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SheetHandleFixedToTop } from '@/components/sheet';

export const DEFAULT_CONTAINER_PROPS: Partial<BottomSheetModalProps> = {
  enableDynamicSizing: true,
  handleComponent: () => <SheetHandleFixedToTop />,
};

export const DEFAULT_SCROLL_VIEW_PROPS: Partial<ComponentProps<typeof BottomSheetScrollView>> = {
  style: {
    flex: 1,
  },
  showsVerticalScrollIndicator: false,
};

export type OpenProps = {
  key: string;
  title: React.FC<any>;
  body: React.FC<any>;
  footer?: React.FC<any>;
  containerProps?: Partial<BottomSheetModalProps>;
  scrollViewProps?: Partial<ComponentProps<typeof BottomSheetScrollView>>;
  onDismiss?: () => void;
};

type PortalActions = {
  open: (props: OpenProps) => void;
  close: () => void;
};

type PortalStore = {
  ref: RefObject<BottomSheetModal> | null;
  key: string | undefined;
  title: React.FC<any> | undefined;
  body: React.FC<any> | undefined;
  footer?: React.FC<any> | undefined;
  containerProps?: Partial<BottomSheetModalProps>;
  scrollViewProps?: Partial<ComponentProps<typeof BottomSheetScrollView>>;
  onDismiss?: () => void;
} & PortalActions;

export const usePortalStore = createRainbowStore<PortalStore>(set => ({
  ref: createRef<BottomSheetModal>(),
  key: undefined,
  title: undefined,
  body: undefined,
  footer: undefined,
  open: ({
    key,
    title,
    body,
    footer,
    containerProps = DEFAULT_CONTAINER_PROPS,
    scrollViewProps = DEFAULT_SCROLL_VIEW_PROPS,
    onDismiss,
  }: OpenProps) => {
    set({
      key,
      title,
      body,
      footer,
      containerProps,
      scrollViewProps,
      onDismiss,
    });
  },
  close: () => {
    set({ key: undefined });
  },
}));
