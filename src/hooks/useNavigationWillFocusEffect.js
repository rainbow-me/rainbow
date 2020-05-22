import { useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigationEvents } from 'react-navigation-hooks';

export default function useNavigationWillFocusEffect(effect) {
  // eslint-disable-next-line no-unused-vars
  const handleWillFocus = useCallback(
    ({ type }) => {
      if (type === 'willFocus') {
        effect();
      }
    },
    [effect]
  );

  // TODO nav
  //useNavigationEvents(handleWillFocus);
}
