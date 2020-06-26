import { useLayoutEffect } from 'react';
import { StatusBar } from 'react-native';
import { useNavigation } from './Navigation';

export default function useStatusBarManaging() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener(
      'transitionStart',
      ({ data: { closing } }) => {
        if (closing) {
          StatusBar.setBarStyle('dark-content');
        } else {
          StatusBar.setBarStyle('light-content');
        }
      }
    );

    return unsubscribe;
  }, [navigation]);
}
