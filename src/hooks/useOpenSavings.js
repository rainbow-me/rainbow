import { useSelector } from 'react-redux';
import { setOpenSavings } from '../redux/openStateSettings';

export default function useOpenSavings() {
  const openSavingsData = useSelector(
    ({ openStateSettings: { openSavings } }) => ({
      openSavings,
    })
  );
  return {
    setOpenSavings,
    ...openSavingsData,
  };
}
