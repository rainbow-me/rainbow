const sortList = (array = [], sortByKey) =>
  array.slice(0).sort((a, b) => {
    const itemA = sortByKey ? a[sortByKey] : a;
    const itemB = sortByKey ? b[sortByKey] : b;

    if (typeof itemA === 'string' && typeof itemB === 'string') {
      if (itemA.toLowerCase() < itemB.toLowerCase()) return -1;
      if (itemA.toLowerCase() > itemB.toLowerCase()) return 1;
    }

    if (itemA < itemB) return -1;
    if (itemA > itemB) return 1;
    return 0;
  });

export default sortList;
