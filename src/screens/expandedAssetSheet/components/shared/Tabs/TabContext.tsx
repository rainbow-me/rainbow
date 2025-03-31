import { Box, BoxProps } from '@/design-system';
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
  wrapperStyles,
  children,
}: {
  tabs: string[];
  accentColor: string;
  initialActiveTabIndex?: number;
  wrapperStyles?: BoxProps;
  children: React.ReactNode;
}) => {
  const activeTabIndex = useSharedValue(clamp(initialActiveTabIndex, 0, tabs.length - 1));

  const isExpanded = useSharedValue(false);

  return (
    <TabContext.Provider value={{ tabs, activeTabIndex, accentColor, isExpanded }}>
      <Box gap={24} {...wrapperStyles}>
        {children}
      </Box>
    </TabContext.Provider>
  );
};

export const useTabContext = () => useContext(TabContext);
