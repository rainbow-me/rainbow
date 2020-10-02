import { sendableUniqueTokensSelector } from '../hoc/uniqueTokenSelectors';
import { useSelector } from '@rainbow-me/react-redux';

export default function useSendableUniqueTokens() {
  return useSelector(sendableUniqueTokensSelector);
}
