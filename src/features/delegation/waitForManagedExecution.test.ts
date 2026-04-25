import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';

import { waitForManagedExecutionConfirmation } from './waitForManagedExecution';

const mockGetStatus = jest.fn<Promise<{ status: RelayStatusSnapshot }>, [string]>();

jest.mock('@/features/delegation/relayService', () => ({
  relayService: {
    getStatus: (executionId: string) => mockGetStatus(executionId),
  },
}));

jest.mock('@/utils/delay', () => ({
  delay: () => Promise.resolve(),
}));

function buildRelayUpdate(status: RelayExecutionStatus, errorMessage?: string): { status: RelayStatusSnapshot } {
  return {
    status: {
      status,
      updatedAtMs: 1,
      ...(errorMessage ? { errorMessage } : {}),
    },
  };
}

describe('waitForManagedExecutionConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('polls relay status until confirmation', async () => {
    mockGetStatus
      .mockResolvedValueOnce(buildRelayUpdate(RelayExecutionStatus.Pending))
      .mockResolvedValueOnce(buildRelayUpdate(RelayExecutionStatus.Confirmed));

    await expect(waitForManagedExecutionConfirmation('execution-id')).resolves.toBeUndefined();

    expect(mockGetStatus).toHaveBeenCalledTimes(2);
    expect(mockGetStatus).toHaveBeenCalledWith('execution-id');
  });

  it('continues polling after transient relay status errors', async () => {
    mockGetStatus.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(buildRelayUpdate(RelayExecutionStatus.Confirmed));

    await expect(waitForManagedExecutionConfirmation('execution-id')).resolves.toBeUndefined();

    expect(mockGetStatus).toHaveBeenCalledTimes(2);
  });

  it('surfaces terminal relay failure details', async () => {
    mockGetStatus.mockResolvedValueOnce(buildRelayUpdate(RelayExecutionStatus.Reverted, 'execution reverted'));

    await expect(waitForManagedExecutionConfirmation('execution-id')).rejects.toThrow(
      'Managed relay execution reverted: execution reverted'
    );
  });
});
