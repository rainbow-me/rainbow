import { useQuery } from 'react-query';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchProfile>
) {
  const { data, error, isLoading, isSuccess, isError } = useQuery<
    UseQueryData<typeof fetchProfile>
  >(['ens-profile', name], () => fetchProfile(name), config);

  return { data, error, isError, isLoading, isSuccess };
}
