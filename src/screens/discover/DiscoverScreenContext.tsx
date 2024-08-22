import React, { createContext, useState, useRef, ReactNode, useContext } from 'react';
import DiscoverSearchInput from '@/components/discover/DiscoverSearchInput';
import { Keyboard } from 'react-native';

export type DiscoverScreenContextType = {
  isSearching: boolean;
  isFetchingEns: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFetchingEns: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSearchModeEnabled: boolean;
  setIsSearchModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  searchInputRef: React.RefObject<any>;
  cancelSearch: () => void;
  dismissKeyboard: () => void;
};

export const DiscoverScreenContext = createContext<DiscoverScreenContextType | null>(null);

interface DiscoverScreenProviderProps {
  children: ReactNode;
}

export const DiscoverScreenProvider: React.FC<DiscoverScreenProviderProps> = ({ children }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(true);
  const searchInputRef = useRef<any>(null);

  const cancelSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setIsFetchingEns(false);
    setIsSearchModeEnabled(false);
    // Add any other logic needed for canceling the search
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const value: DiscoverScreenContextType = {
    isSearching,
    isFetchingEns,
    setIsSearching,
    setIsFetchingEns,
    searchQuery,
    setSearchQuery,
    isSearchModeEnabled,
    setIsSearchModeEnabled,
    searchInputRef,
    cancelSearch,
    dismissKeyboard,
  };

  return <DiscoverScreenContext.Provider value={value}>{children}</DiscoverScreenContext.Provider>;
};

export const useDiscoverScreenContext = () => {
  const context = useContext(DiscoverScreenContext);
  if (!context) {
    throw new Error('useDiscoverScreenContext must be used within a DiscoverScreenProvider');
  }
  return context;
};

export default DiscoverScreenContext;
