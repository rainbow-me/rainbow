import { useQuery } from '@tanstack/react-query';
import { Address } from 'viem';

import { estimateApprove } from '@/raps/actions';
import { estimateERC721Approval } from '@/raps/actions/unlock';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { gasUnits } from '@/references/gasUnits';
import { ChainId } from '@/__swaps__/types/chains';

// ///////////////////////////////////////////////
// Query Types

export type EstimateAprovalGasLimitArgs = {
  chainId: ChainId;
  ownerAddress: Address;
  assetAddress?: Address;
  spenderAddress?: Address;
  assetType: 'erc20' | 'nft';
};

// ///////////////////////////////////////////////
// Query Key

const estimateApprovalGasLimitQueryKey = ({
  chainId,
  ownerAddress,
  assetAddress,
  spenderAddress,
  assetType,
}: EstimateAprovalGasLimitArgs) =>
  createQueryKey(
    'estimateApprovalGasLimitQueryKey',
    { chainId, ownerAddress, assetAddress, spenderAddress, assetType },
    { persisterVersion: 1 }
  );

type EstimateApprovalGasLimitQueryKey = ReturnType<typeof estimateApprovalGasLimitQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function estimateApprovalGasLimitQueryFunction({
  queryKey: [{ chainId, ownerAddress, assetAddress, spenderAddress, assetType }],
}: QueryFunctionArgs<typeof estimateApprovalGasLimitQueryKey>) {
  if (!assetAddress || !spenderAddress) return gasUnits.basic_approval[chainId];
  if (assetType === 'erc20') {
    const gasLimit = await estimateApprove({
      owner: ownerAddress,
      tokenAddress: assetAddress,
      spender: spenderAddress,
      chainId,
    });
    return gasLimit;
  } else {
    const gasLimit = await estimateERC721Approval({
      owner: ownerAddress,
      tokenAddress: assetAddress,
      spender: spenderAddress,
      chainId,
    });
    return gasLimit;
  }
}

type EstimateApprovalGasLimitResult = QueryFunctionResult<typeof estimateApprovalGasLimitQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchEstimateSwapGasLimit(
  { chainId, ownerAddress, assetAddress, spenderAddress, assetType }: EstimateAprovalGasLimitArgs,
  config: QueryConfigWithSelect<
    EstimateApprovalGasLimitResult,
    Error,
    EstimateApprovalGasLimitResult,
    EstimateApprovalGasLimitQueryKey
  > = {}
) {
  return await queryClient.fetchQuery(
    estimateApprovalGasLimitQueryKey({
      chainId,
      ownerAddress,
      assetAddress,
      spenderAddress,
      assetType,
    }),
    estimateApprovalGasLimitQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useEstimateApprovalGasLimit(
  { chainId, ownerAddress, assetAddress, spenderAddress, assetType }: EstimateAprovalGasLimitArgs,
  config: QueryConfigWithSelect<
    EstimateApprovalGasLimitResult,
    Error,
    EstimateApprovalGasLimitResult,
    EstimateApprovalGasLimitQueryKey
  > = {}
) {
  return useQuery(
    estimateApprovalGasLimitQueryKey({
      chainId,
      ownerAddress,
      assetAddress,
      spenderAddress,
      assetType,
    }),
    estimateApprovalGasLimitQueryFunction,
    { keepPreviousData: true, ...config }
  );
}
