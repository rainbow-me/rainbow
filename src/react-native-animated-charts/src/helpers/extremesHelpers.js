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

export function addExtremesIfNeeded(res, data, includeExtremes, removePointsSurroundingExtremes) {
  if (includeExtremes) {
    const { greatestY, smallestY } = findYExtremes(data);

    const [ex1, ex2] = [greatestY, smallestY].sort((a, b) => a.x < b.x);
    let added1 = false;
    let added2 = false;

    const newRes = [];
    for (let i = 0; i < res.length; i++) {
      const d = res[i];
      let justAdded1 = false;
      let justAdded2 = false;
      if (!added1 && (newRes.length === 0 || newRes[newRes.length - 1].x <= ex1.x) && ex1.x <= d.x) {
        justAdded1 = true;
        added1 = true;
        if (ex1.x !== d.x) {
          if (removePointsSurroundingExtremes) {
            newRes.pop();
          }
          newRes.push(ex1);
        }
      }
      if (!added2 && (newRes.length === 0 || newRes[newRes.length - 1].x <= ex2.x) && ex2.x <= d.x) {
        justAdded2 = true;
        added2 = true;
        if (ex2.x !== d.x) {
          if (!justAdded1 && removePointsSurroundingExtremes) {
            newRes.pop();
          }

          newRes.push(ex2);
        }
      }
      if ((!justAdded1 && !justAdded2) || !removePointsSurroundingExtremes || i === res.length - 1) {
        newRes.push(d);
      }
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
