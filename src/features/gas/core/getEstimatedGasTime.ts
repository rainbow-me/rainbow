import { time } from '@/framework/core/utils/time';
import { getMinimalTimeUnitStringForMs } from '@/helpers/time';
import { abs, lessThan, subtract } from '@/helpers/utilities';

/**
 * Formats the confirmation time quoted nearest to the selected priority fee.
 */
export function getEstimatedGasTime(
  priorityFeeByConfirmationTime: Readonly<Record<string, string>> | undefined,
  selectedPriorityFee: string | undefined
): string | undefined {
  if (!priorityFeeByConfirmationTime || selectedPriorityFee === undefined) return undefined;

  let nearestPriorityFee: string | undefined;
  for (const seconds in priorityFeeByConfirmationTime) {
    const quotedPriorityFee = priorityFeeByConfirmationTime[seconds];
    if (nearestPriorityFee !== undefined) {
      if (!quotedPriorityFee) break;

      const nearestFeeDifference = abs(subtract(nearestPriorityFee, selectedPriorityFee));
      const quotedFeeDifference = abs(subtract(quotedPriorityFee, selectedPriorityFee));
      if (lessThan(nearestFeeDifference, quotedFeeDifference)) break;
    }
    nearestPriorityFee = quotedPriorityFee;
  }

  if (!nearestPriorityFee) return undefined;

  for (const seconds in priorityFeeByConfirmationTime) {
    if (priorityFeeByConfirmationTime[seconds] !== nearestPriorityFee) continue;
    const milliseconds = time.seconds(Number(seconds));
    return `${milliseconds >= time.hours(1) ? '> ' : '~'}${getMinimalTimeUnitStringForMs(milliseconds)}`;
  }
}
