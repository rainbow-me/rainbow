import { useQuery } from 'react-query';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchProfile>
) {
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfile>
  >(['ens-profile', name], () => fetchProfile(name), config);

  return { data, isLoading, isSuccess };
}
