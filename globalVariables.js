import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { ENABLE_DEV_MODE } from 'react-native-dotenv';

import magicMemo from '@/utils/magicMemo';

export default {
  IS_DEV: (typeof __DEV__ === 'boolean' && __DEV__) || !!Number(ENABLE_DEV_MODE),
  magicMemo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  web: Platform.OS === 'web',
};
