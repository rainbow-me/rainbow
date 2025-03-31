import { TabBar } from './TabBar';
import { TabView } from './TabView';
import { TabProvider } from './TabContext';
import React, { useMemo } from 'react';
import { View } from 'react-native';

type TabsChildren<T extends string[], U extends boolean | undefined> = U extends false
  ? React.ReactNode
  : readonly [...{ [K in keyof T]: React.ReactNode }];

interface TabsProps<T extends string[], U extends boolean | undefined = undefined> {
  tabs: T;
  accentColor: string;
  initialActiveTabIndex?: number;
  useViewController?: U;
  children: TabsChildren<T, U>;
}

/**
 * Reanimated powered tabs component
 * @param tabs - Array of tab names
 * @param accentColor - Color of the active tab
 * @param initialActiveTabIndex - Index of the initial active tab
 * @param children - Array of tab content
 *
 * IMPORTANT TO NOTE:
 * The children array must be of the same length as the tabs array.
 * The order of the children corresponds to the order of the tabs.
 *
 * @returns Tabs component
 */
export const Tabs = <T extends string[], U extends boolean | undefined = undefined>({
  tabs,
  accentColor,
  initialActiveTabIndex,
  children,
  useViewController,
}: TabsProps<T, U>) => {
  return (
    <TabProvider tabs={tabs} accentColor={accentColor} initialActiveTabIndex={initialActiveTabIndex}>
      <TabBar />
      <TabContent tabs={tabs} useViewController={useViewController}>
        {children}
      </TabContent>
    </TabProvider>
  );
};

export const TabContent = ({
  tabs,
  children,
  useViewController,
}: {
  tabs: string[];
  children: React.ReactNode;
  useViewController?: boolean;
}) => {
  if (!useViewController) {
    return children;
  }

  // This is always in the same order if useViewController is true, so ignoring it
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
  if (childrenArray.length !== tabs.length) {
    throw new Error(`Tabs component requires children length (${childrenArray.length}) to match tabs length (${tabs.length})`);
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <TabView>{childrenArray}</TabView>
    </View>
  );
};
