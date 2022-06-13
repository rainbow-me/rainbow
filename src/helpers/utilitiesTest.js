export const smallObj = {
  company: 'ABC1',
  country: 'IN',
  id: 1001,
  name: 'Some',
  priceObj: {
    amount: 100,
    currency: 'USD',
  },
  result: 0,
  value1: 1,
  value2: 2,
  zip: 1,
};
export const largeObj = {
  eight: {
    company: 'ABC2',
    country: 'IN',
    id: 107,
    name: 'Some',
    priceObj: {
      amount: 107,
      currency: 'USD',
    },
    result: 0,
    value1: 8,
    value2: 8,
    zip: 8,
  },
  five: {
    company: 'ABC2',
    country: 'IN',
    id: 104,
    name: 'Some',
    priceObj: {
      amount: 104,
      currency: 'USD',
    },
    result: 0,
    value1: 5,
    value2: 5,
    zip: 5,
  },
  four: {
    company: 'ABC3',
    country: 'IN',
    id: 103,
    name: 'Some',
    priceObj: {
      amount: 103,
      currency: 'USD',
    },
    result: 0,
    value1: 3,
    value2: 3,
    zip: 3,
  },
  nine: {
    company: 'ABC2',
    country: 'IN',
    id: 108,
    name: 'Some',
    priceObj: {
      amount: 108,
      currency: 'USD',
    },
    result: 0,
    value1: 9,
    value2: 9,
    zip: 9,
  },
  one: {
    company: 'ABC1',
    country: 'IN',
    id: 100,
    name: 'Some',
    priceObj: {
      amount: 100,
      currency: 'USD',
    },
    result: 0,
    value1: 1,
    value2: 1,
    zip: 1,
  },
  seven: {
    company: 'ABC2',
    country: 'IN',
    id: 106,
    name: 'Some',
    priceObj: {
      amount: 106,
      currency: 'USD',
    },
    result: 0,
    value1: 7,
    value2: 7,
    zip: 7,
  },
  six: {
    company: 'ABC2',
    country: 'IN',
    id: 105,
    name: 'Some',
    priceObj: {
      amount: 105,
      currency: 'USD',
    },
    result: 0,
    value1: 6,
    value2: 6,
    zip: 6,
  },
  ten: {
    company: 'ABC2',
    country: 'IN',
    id: 109,
    name: 'Some',
    priceObj: {
      amount: 109,
      currency: 'USD',
    },
    result: 0,
    value1: 10,
    value2: 10,
    zip: 10,
  },
  three: {
    company: 'ABC3',
    country: 'IN',
    id: 102,
    name: 'Some',
    priceObj: {
      amount: 102,
      currency: 'USD',
    },
    result: 0,
    value1: 3,
    value2: 3,
    zip: 3,
  },
  two: {
    company: 'ABC2',
    country: 'IN',
    id: 101,
    name: 'Some',
    priceObj: {
      amount: 101,
      currency: 'USD',
    },
    result: 0,
    value1: 2,
    value2: 2,
    zip: 2,
  },
};
export const pathsArr = [
  'eight',
  'one',
  'seven',
  'two',
  'five',
  'three',
  'four',
  'six',
];
export const smallArr = [smallObj, smallObj, smallObj, smallObj, smallObj];
export const arr = [
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
];
export const fnReturnId = v => v?.id;
export const isIdEven = v => v?.id % 2;
export const addValue = props => props.value1 + props.value2;
export const addValueDestructuring = ({ value1, value2 }) => value1 + value2;
export const addValueAndCreateNewField = i => {
  i.priceObj = { amount: i.value1 + i.value2 };
};

export const formObj = ({ company, id, zip, value1, value2 }) => ({
  id: `${company}+${id}+${zip}`,
  value: value1 + value2,
});

export const forOfArr = arr => {
  for (const element of arr) {
    addValueAndCreateNewField(element);
  }
};

export const forLoop = arr => {
  for (let i = 0; i < arr.length; i++) {
    addValueAndCreateNewField(arr[i]);
  }
};

//Array.map vs lodash.map vs for vs for..of
export const forOfLikeMap = (arr, fn) => {
  const result = [];
  for (const v of arr) {
    result.push(fn(v));
  }
  return result;
};
export const forLikeMap = (arr, fn) => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i] = fn(arr[i]);
  }
  return result;
};

export const forOfLikeReduce = arr => {
  let acc = 0;
  for (const { value1, value2 } of arr) {
    acc += value1 + value2;
  }
  return acc;
};
export const forLoopReduce = arr => {
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += arr[i].value1 + arr[i].value2;
  }
  return acc;
};

export const forOfLikeReduceObj = arr => {
  let acc = {};
  for (const value of arr) {
    acc[value.id] = value;
  }
  return acc;
};
export const forLoopReduceObj = arr => {
  let acc = {};
  for (let i = 0; i < arr.length; i++) {
    acc[arr[i].id] = arr[i];
  }
  return acc;
};
export const forOfLikeReduceObjSpread = arr => {
  let acc = {};
  for (const value of arr) {
    acc[value.id] = { ...value, newField: value.value1 + value.value2 };
  }
  return acc;
};
export const forLoopReduceObjSpread = arr => {
  let acc = {};
  for (let i = 0; i < arr.length; i++) {
    acc[arr[i].id] = { ...arr[i], newField: arr[i].value1 + arr[i].value2 };
  }
  return acc;
};

export const pickFlattenReduce = (obj, paths) => {
  return paths.reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
      return acc;
    }
    return acc;
  }, {});
};
export const pickFlattenKeys = (obj, paths) => {
  return Object.keys(obj)
    .filter(key => paths.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};
export const pickFlattenFromEntries = (obj, paths) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => paths.includes(key))
  );
};

export const pickBy = (obj, predicate) => {
  return Object.keys(obj)
    .filter(k => predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

export const omitForIn = (obj, keysToOmit) => {
  const keys = Array.isArray(keysToOmit) ? keysToOmit : [keysToOmit];
  const newObj = {};
  for (const key in obj) {
    if (!keys.includes(key)) newObj[key] = obj[key];
  }
  return newObj;
};
export const omitForInWithSet = (obj, keys) => {
  const keysArr = Array.isArray(keys) ? keys : [keys];
  const newObj = {};
  const keysToOmit = new Set(keysArr);
  for (const key in obj) {
    if (!keysToOmit.has(key)) newObj[key] = obj[key];
  }
  return newObj;
};
export const omitReduce = (obj, keysToOmit) =>
  keysToOmit.reduce(
    (mem, key) => ((k, { [k]: ignored, ...rest }) => rest)(key, mem),
    obj
  );

export const omitForEach = (obj, keys) => {
  const n = {};
  Object.keys(obj).forEach(key => {
    if (keys.includes(key)) {
      n[key] = obj[key];
    }
  });
  return n;
};

export const omitBy = (obj, predicate) => {
  return Object.keys(obj)
    .filter(k => !predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

export const times = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
