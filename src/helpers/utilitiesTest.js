import { forEach, map, reduce } from 'lodash';

const testArr = [];
export const fnReturnId = v => v?.id;
export const isIdEven = v => v?.id % 2;
export const addValue = ({ value1, value2 }) => value1 + value2;
const addValueAndCreateNewField = i => {
  i.result = i.value1 + i.value2;
  i.priceObj = i.result;
};
const reduceStuffLodash = ([key, value], acc) => {
  acc[key] = { id: value.id, result: value.value1 + value.value2 };
  return acc;
};
const reduceStuffMethod = (acc, [key, value]) => {
  acc[key] = { id: value.id, result: value.value1 + value.value2 };
  return acc;
};

export const formObj = ({ company, id, zip, value1, value2 }) => ({
  id: `${company}+${id}+${zip}`,
  value: value1 + value2,
});

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//
//
//
////////////////////////////////////////////////////////////////
//Array.forEach vs lodash.forEach vs for..of and for
export const forEachLodash = arr => forEach(arr, addValueAndCreateNewField);
export const forEachNative = arr => arr.forEach(addValueAndCreateNewField);
export const forEachSet = arr => {
  new Set(arr).forEach(addValueAndCreateNewField);
};
//////
export const forOfArr = arr => {
  for (const element of arr) {
    addValueAndCreateNewField(element);
  }
};
export const forOfSet = arr => {
  for (const element of new Set(arr)) {
    addValueAndCreateNewField(element);
  }
};
export const forLoop = arr => {
  for (let i = 0; i < arr.length; i++) {
    addValueAndCreateNewField(arr[i]);
  }
};
////////////////////////////////////////////////////////////////
//
//
//
////////////////////////////////////////////////////////////////
//Array.map vs lodash.map vs for vs for..of
export const mapLodash = v => map(v, addValue);
export const mapNative = v => v.map(addValue);

////////////
export const forOfLikeMap = (arr, fn) => {
  const result = [];
  for (const v of arr) {
    result.push(fn(v));
  }
  return result;
};
export const forLikeMap = arr => {
  const result = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    result[i].result = arr[i].value1 + arr[i].value2;
    result[i].priceObj = arr[i].result;
  }
  return result;
};

////////////////////////////////////////////////////////////////
//
//
//
////////////////////////////////////////////////////////////////
//Array.reduce vs lodash.reduce vs for and for..of

export const reduceLodash = arr =>
  reduce(
    arr,
    ({ value1, value2 }) => {
      return value1 + value2;
    },
    0
  );
export const reduceNative = arr =>
  arr.reduce((acc, { value1, value2 }) => {
    acc['sum'] = value1 + value2;
    return acc;
  }, 0);

///////
export const forOfLikeReduce = arr => {
  let acc = 0;
  for (const { value1, value2 } of arr) {
    acc = value1 + value2;
  }
  return acc;
};

////////////////////////////////////////////////////////////////
//
//
//
////////////////////////////////////////////////////////////////
//
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
//
//
//
//
//
//
//
//
// mapValues /////mapValues(typeHierarchy.text, createTextSize);
// const headingSizes = Object.entries(typeHierarchy.heading).reduce(
//   (acc, [key, value]) => {
//     acc[key] = createTextSize(value);
//     return acc;
//   },
//   {}
// );

// export const textSizes = Object.entries(typeHierarchy.text).reduce(
//   (acc, [key, value]) => {
//     acc[key] = createTextSize(value);

//     return acc;
//   },
//   {}
// );
//
//
//
//
//
export const omitForIn = (obj, keysToOmit) => {
  const keys = Array.isArray(keysToOmit) ? keysToOmit : [keysToOmit];
  const newObj = {};
  for (const key in obj) {
    if (!keys.includes(key)) newObj[key] = obj[key];
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
//
//
export const omitBy = (obj, predicate) => {
  return Object.keys(obj)
    .filter(k => !predicate(obj[k], k))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};
//
//
//
//
//
////////////////////////////////////////////////////////////////

// const object = { a: 1, b: 2, c: 3 };

// for (const property in object) {
//   console.log(`${property}: ${object[property]}`);
// }
// // expected output:
// // "a: 1"
// // "b: 2"
// // "c: 3"
// ////////////////////////////////////////////////////////////////
// const array1 = ['a', 'b', 'c'];

// for (const element of array1) {
//   console.log(element);
// }

// // expected output: "a"
// // expected output: "b"
// // expected output: "c"
