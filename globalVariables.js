import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { ENABLE_DEV_MODE } from 'react-native-dotenv';
import { useTheme } from './src/context/ThemeContext';
import magicMemo from '@rainbow-me/utils/magicMemo';

export default {
  android: Platform.OS === 'android',
  ios: Platform.OS === 'ios',
  IS_DEV:
    (typeof __DEV__ === 'boolean' && __DEV__) || !!Number(ENABLE_DEV_MODE),
  magicMemo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTheme,
};
