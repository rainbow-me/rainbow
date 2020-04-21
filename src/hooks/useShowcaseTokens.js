import { useSelector } from 'react-redux';
import { popShowcaseToken, pushShowcaseToken } from '../redux/showcaseTokens';

export default function useShowcaseTokens() {
  const showcaseData = useSelector(
    ({ showcaseTokens: { showcaseTokens } }) => ({
      showcaseTokens,
    })
  );
  return {
    popShowcaseToken,
    pushShowcaseToken,
    ...showcaseData,
  };
}
