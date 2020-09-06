export function findYExtremes(data) {
  let smallestY = null;
  let greatestY = null;
  for (const d of data) {
    if (d.y !== undefined && (smallestY === null || d.y < smallestY.y)) {
      smallestY = d;
    }

    if (d.y !== undefined && (greatestY === null || d.y > greatestY.y)) {
      greatestY = d;
    }
  }
  return {
    greatestY,
    smallestY,
  };
}

export function addExtremesIfNeeded(res, data, includeExtremes) {
  if (includeExtremes) {
    const { greatestY, smallestY } = findYExtremes(data);

    const [ex1, ex2] = [greatestY, smallestY].sort((a, b) => a.x < b.x);
    let added1 = false;
    let added2 = false;

    const newRes = [];
    for (let d of res) {
      if (
        (newRes.length === 0 || newRes[newRes.length - 1].x < ex1.x) &&
        ex1.x < d.x
      ) {
        added1 = true;
        newRes.push(ex1);
      }
      if (
        (newRes.length === 0 || newRes[newRes.length - 1].x < ex2.x) &&
        ex2.x < d.x
      ) {
        added2 = true;
        newRes.push(ex2);
      }
      newRes.push(d);
    }
    if (!added1) {
      newRes.push(ex1);
    }
    if (!added2) {
      newRes.push(ex2);
    }
    return newRes;
  }
  return res;
}
