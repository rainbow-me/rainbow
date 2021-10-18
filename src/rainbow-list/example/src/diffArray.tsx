type HashedData = { hash: string };
const ignoreMoves = false;

export function getDiffArray(prev: HashedData[], curr: HashedData[]) {
  // O(n) w/o moves
  const newIndices = [];
  const newIndicesSet = new Set();
  const prevHashesToIndices: { [hash: string]: number } = prev.reduce(
    (acc, val, i) => {
      acc[val.hash] = i;
      return acc;
    },
    {} as { [hash: string]: number }
  );

  for (let i = 0; i < curr.length; i++) {
    const currData = curr[i];
    if (prevHashesToIndices[currData.hash] === undefined) {
      newIndices.push(i);
      newIndicesSet.add(i);
    }
  }

  const skeleton = []; // array representing prev with addition, then we model removals
  for (let i of prev) {
    while (newIndicesSet.has(skeleton.length)) {
      skeleton.push(null);
    }
    skeleton.push(i);
  }

  const removedIndices = [];
  const removedIndicesSet = new Set();
  const newHashesToIndices: { [hash: string]: number } = curr.reduce(
    (acc, val, i) => {
      acc[val.hash] = i;
      return acc;
    },
    {} as { [hash: string]: number }
  );

  for (let i = 0; i < skeleton.length; i++) {
    const prevData = skeleton[i];
    if (prevData === null) {
      continue;
    }
    if (newHashesToIndices[prevData.hash] === undefined) {
      removedIndices.push(i);
      removedIndicesSet.add(i);
    }
  }

  if (ignoreMoves) {
    //o(n^2)
    return {
      newIndices,
      removedIndices,
    };
  }

  const finalSkeleton = [];

  for (let i = 0; i < skeleton.length; i++) {
    if (!removedIndicesSet.has(i)) {
      finalSkeleton.push(skeleton[i]);
    }
  }

  const moves = [];

  for (let i = 0; i < finalSkeleton.length; i++) {
    const item = finalSkeleton[i];
    if (item === null) {
      continue;
    }
    if (newHashesToIndices[item.hash] !== i) {
      moves.push({ from: i, to: newHashesToIndices[item.hash] });
    }
  }

  moves.sort((a, b) => b.to - a.to);

  for (let i = 0; i < moves.length; i++) {
    const currMove = moves[i];
    if (currMove.to === currMove.from) {
      continue;
    }
    const sigma =
      Math.abs(currMove.to - currMove.from) / (currMove.to - currMove.from);
    for (let j = i + 1; j < moves.length; j++) {
      const procMove = moves[j];
      if (procMove.from > currMove.from && procMove.from <= currMove.to) {
        procMove.from -= sigma;
      }
    }
  }

  const movedTraversed: number[] = moves
    .filter(({ from, to }) => from !== to)
    .reduce((acc, curr) => {
      acc.push(curr.from);
      acc.push(curr.to);
      return acc;
    }, [] as number[]);

  // moves are not working
  return {
    newIndices,
    removedIndices,
    movesIndices: movedTraversed,
  };
}
