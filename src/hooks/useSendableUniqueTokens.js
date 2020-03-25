import { useSelector } from 'react-redux';
import { sendableUniqueTokensSelector } from '../hoc/uniqueTokenSelectors';

export default function useSendableUniqueTokens() {
  return useSelector(sendableUniqueTokensSelector);
}
