import React, { createContext, PropsWithChildren, useContext } from 'react';
import { makeMutable, SharedValue } from 'react-native-reanimated';

export type BaseTabContext<T extends ReadonlyArray<string>> = {
  tabs: T;
  accentColor: string;
  isExpanded: SharedValue<boolean>;
};

export type AnimatedTabContext = {
  activeTabIndex: SharedValue<number>;
  setActiveTabIndex?: undefined;
};

export type StatefulTabContext = {
  activeTabIndex: number;
  setActiveTabIndex: (index: number) => void;
};

export type TabViewController = React.ReactElement;

export type TabContextType<T extends ReadonlyArray<string>> = BaseTabContext<T> & (AnimatedTabContext | StatefulTabContext);

export const TabContext = createContext<TabContextType<ReadonlyArray<string>>>({
  tabs: [],
  accentColor: 'blue',
  isExpanded: makeMutable(false),
  activeTabIndex: makeMutable(0),
  setActiveTabIndex: undefined,
});

export const TabProvider = ({ children, ...props }: PropsWithChildren<TabContextType<ReadonlyArray<string>>>) => {
  return <TabContext.Provider value={props}>{children}</TabContext.Provider>;
};

export const useTabContext = () => useContext(TabContext);
