import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfile() {
  const ensRegistration = useSelector(
    ({ ensRegistration }: AppState) => ensRegistration
  );

  return {
    ...ensRegistration,
  };
}
