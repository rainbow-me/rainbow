import { useCallback } from 'react';
import { useNavigationEvents } from 'react-navigation-hooks';

export default function useNavigationWillFocusEffect(effect) {
  const handleWillFocus = useCallback(
    ({ type }) => {
      if (type === 'willFocus') {
        effect();
      }
    },
    [effect]
  );

  useNavigationEvents(handleWillFocus);
}
