export const smallObj = {
  a: 1,
  b: 2,
  company: 'ABC1',
  country: 'IN',
  id: 1001,
  name: 'Some',
  priceObj: {
    amount: 100,
    currency: 'USD',
  },
  result: 0,
  zip: 1,
};
export const largeObj = {
  eight: {
    a: 8,
    b: 8,
    company: 'ABC2',
    country: 'IN',
    id: 107,
    name: 'Some',
    priceObj: {
      amount: 107,
      currency: 'USD',
    },
    result: 0,
    zip: 8,
  },
  five: {
    a: 5,
    b: 5,
    company: 'ABC2',
    country: 'IN',
    id: 104,
    name: 'Some',
    priceObj: {
      amount: 104,
      currency: 'USD',
    },
    result: 0,
    zip: 5,
  },
  four: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 103,
    name: 'Some',
    priceObj: {
      amount: 103,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  nine: {
    a: 9,
    b: 9,
    company: 'ABC2',
    country: 'IN',
    id: 108,
    name: 'Some',
    priceObj: {
      amount: 108,
      currency: 'USD',
    },
    result: 0,
    zip: 9,
  },
  one: {
    a: 1,
    b: 1,
    company: 'ABC1',
    country: 'IN',
    id: 100,
    name: 'Some',
    priceObj: {
      amount: 100,
      currency: 'USD',
    },
    result: 0,
    zip: 1,
  },
  seven: {
    a: 7,
    b: 7,
    company: 'ABC2',
    country: 'IN',
    id: 106,
    name: 'Some',
    priceObj: {
      amount: 106,
      currency: 'USD',
    },
    result: 0,
    zip: 7,
  },
  six: {
    a: 6,
    b: 6,
    company: 'ABC2',
    country: 'IN',
    id: 105,
    name: 'Some',
    priceObj: {
      amount: 105,
      currency: 'USD',
    },
    result: 0,
    zip: 6,
  },
  ten: {
    a: 10,
    b: 10,
    company: 'ABC2',
    country: 'IN',
    id: 109,
    name: 'Some',
    priceObj: {
      amount: 109,
      currency: 'USD',
    },
    result: 0,
    zip: 10,
  },
  three: {
    a: 3,
    b: 3,
    company: 'ABC3',
    country: 'IN',
    id: 102,
    name: 'Some',
    priceObj: {
      amount: 102,
      currency: 'USD',
    },
    result: 0,
    zip: 3,
  },
  two: {
    a: 2,
    b: 2,
    company: 'ABC2',
    country: 'IN',
    id: 101,
    name: 'Some',
    priceObj: {
      amount: 101,
      currency: 'USD',
    },
    result: 0,
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
export const smallArr = Array.from(Array(5)).map((_, i) => ({
  ...smallObj,
  a: i,
  b: i / 2,
  id: i + 1,
}));
export const arr = Array.from(Array(28)).map((_, i) => ({
  ...smallObj,
  a: i,
  b: i / 2,
  id: i + 1,
}));
export const fnReturnId = v => v?.id;
export const isIdEven = v => v?.id % 2;
export const addValue = item => item.a + item.b;
export const addValueDestructuring = ({ a, b }) => a + b;
export const payloadForLoop = i => {
  i.priceObj = { amount: i.a + i.b };
};

export const forOfArr = arr => {
  for (const element of arr) {
    payloadForLoop(element);
  }
};

export const forLoop = arr => {
  for (let i = 0; i < arr.length; i++) {
    payloadForLoop(arr[i]);
  }
};

//Array.map vs lodash.map vs for vs for..of
export const forOfLikeMap = (arr, payload) => {
  const result = [];
  for (const v of arr) {
    result.push(payload(v));
  }
  return result;
};
export const forLikeMap = (arr, payload) => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i] = payload(arr[i]);
  }
  return result;
};
export const forOfLikeMap1 = arr => {
  const result = [];
  for (const v of arr) {
    result.push(v.a + v.b);
  }
  return result;
};
export const forLikeMap1 = arr => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i] = arr[i].a + arr[i].b;
  }
  return result;
};

export const forOfLikeReduce = arr => {
  let acc = 0;
  for (const { a, b } of arr) {
    acc += a + b;
  }
  return acc;
};
export const forLoopReduce = arr => {
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += arr[i].a + arr[i].b;
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
    acc[value.id] = { ...value, newField: value.a + value.b };
  }
  return acc;
};
export const forLoopReduceObjSpread = arr => {
  let acc = {};
  for (let i = 0; i < arr.length; i++) {
    acc[arr[i].id] = { ...arr[i], newField: arr[i].a + arr[i].b };
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
