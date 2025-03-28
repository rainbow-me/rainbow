import { Box } from '@/design-system';
import React, { createContext, useContext } from 'react';
import { clamp, makeMutable, SharedValue, useSharedValue } from 'react-native-reanimated';

export const TabContext = createContext<{
  tabs: string[];
  activeTabIndex: SharedValue<number>;
  accentColor: string;
  isExpanded: SharedValue<boolean>;
}>({
  tabs: [],
  activeTabIndex: makeMutable(0),
  accentColor: 'blue',
  isExpanded: makeMutable(false),
});

export const TabProvider = ({
  tabs,
  accentColor,
  initialActiveTabIndex = 0,
  children,
}: {
  tabs: string[];
  accentColor: string;
  initialActiveTabIndex?: number;
  children: React.ReactNode;
}) => {
  const activeTabIndex = useSharedValue(clamp(initialActiveTabIndex, 0, tabs.length - 1));

  const isExpanded = useSharedValue(false);

  return (
    <TabContext.Provider value={{ tabs, activeTabIndex, accentColor, isExpanded }}>
      <Box style={{ position: 'relative' }} gap={24}>
        {children}
      </Box>
    </TabContext.Provider>
  );
};

export const useTabContext = () => useContext(TabContext);
