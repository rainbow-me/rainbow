export const getCrossChainTimeEstimate = ({
  serviceTime,
  gasTimeInSeconds,
}: {
  serviceTime: number;
  gasTimeInSeconds: number;
}): {
  isLongWait: boolean;
  timeEstimate: number;
  timeEstimateDisplay: string;
} => {
  let isLongWait = false;
  let timeEstimateDisplay;
  const timeEstimate = serviceTime + gasTimeInSeconds;

  const minutes = Math.floor(timeEstimate / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) {
    isLongWait = true;
    timeEstimateDisplay = `>${hours} ${hours === 1 ? 'hr' : 'hrs'} 􀇿`;
  } else if (minutes >= 1) {
    timeEstimateDisplay = `~${minutes} min`;
  } else {
    timeEstimateDisplay = `~${timeEstimate} sec`;
  }

  return {
    isLongWait,
    timeEstimate,
    timeEstimateDisplay,
  };
};
