import { Platform, NativeModules } from 'react-native';

export const DEVICE_LANGUAGE = Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale : NativeModules.I18nManager.localeIdentifier;
