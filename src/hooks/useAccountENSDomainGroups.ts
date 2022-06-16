import { useMemo } from 'react';
import useAccountENSDomains from './useAccountENSDomains';
import useAccountProfile from './useAccountProfile';

export default function useAccountENSDomainGroups() {
  const { data: domains, isLoading, isSuccess } = useAccountENSDomains();
  const { accountAddress, accountENS } = useAccountProfile();

  const { ownedDomains, primaryDomain, nonPrimaryDomains } = useMemo(() => {
    const ownedDomains = domains?.filter(
      ({ owner }) => owner?.id?.toLowerCase() === accountAddress?.toLowerCase()
    );
    return {
      nonPrimaryDomains:
        ownedDomains?.filter(({ name }) => accountENS !== name) || [],
      ownedDomains,
      primaryDomain: ownedDomains?.find(({ name }) => accountENS === name),
    };
  }, [accountAddress, accountENS, domains]);

  const uniqueDomain = useMemo(() => {
    return primaryDomain
      ? primaryDomain
      : nonPrimaryDomains?.length === 1
      ? nonPrimaryDomains?.[0]
      : null;
  }, [nonPrimaryDomains, primaryDomain]);

  return {
    isLoading,
    isSuccess,
    nonPrimaryDomains,
    ownedDomains,
    primaryDomain,
    uniqueDomain,
  };
}
