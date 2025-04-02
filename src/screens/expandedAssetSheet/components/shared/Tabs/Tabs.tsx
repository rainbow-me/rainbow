import { TabBar } from './TabBar';
import { TabView } from './TabView';
import { TabProvider, useTabContext, type TabContextType } from './TabContext';
import React, { useMemo } from 'react';
import { View } from 'react-native';

type TabsProps<T extends ReadonlyArray<string>> = TabContextType<T> & {
  children: readonly [...{ [K in keyof T]: React.ReactNode }] | React.ReactNode;
};

/**
 * Reanimated powered tabs component that adapts its children based on ViewController presence.
 *
 * If `ViewController` is provided:
 * - Expects no children.
 * - Renders ViewController directly.
 *
 * If `ViewController` is NOT provided:
 * - Expects a readonly array of `React.ReactNode` as children, matching the length of `tabs`.
 * - Renders the active child directly based on `activeTabIndex`.
 *
 * @param tabs - Array of tab names.
 * @param accentColor - Color of the active tab indicator.
 * @param isExpanded - SharedValue indicating if the container is expanded.
 * @param ViewController - Optional component to wrap and manage the TabView layout.
 * @param activeTabIndex - Either a SharedValue<number> or number, controlling the active tab.
 * @param setActiveTabIndex - Function to set active tab index (only for stateful context).
 * @param children - Content for the tabs, type depends on `ViewController` presence.
 */
export function Tabs<T extends ReadonlyArray<string>>({ children, ...props }: TabsProps<T>) {
  return (
    <TabProvider {...props}>
      <TabBar />
      <TabContent>{children}</TabContent>
    </TabProvider>
  );
}

export function TabContent({ children }: Pick<TabsProps<ReadonlyArray<string>>, 'children'>) {
  const { tabs } = useTabContext();

  const childrenCount = useMemo(() => React.Children.count(children), [children]);
  if (childrenCount === 1) {
    return children;
  }

  // If there are multiple children, proceed with TabView logic
  // This should only run when childrenCount !== 1
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
  if (childrenArray.length !== tabs.length) {
    throw new Error(
      `Tabs component requires children length (${childrenArray.length}) to match tabs length (${tabs.length}) when multiple children are provided.`
    );
  }
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <TabView>{childrenArray}</TabView>
    </View>
  );
}
