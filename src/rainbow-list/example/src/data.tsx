export type DataCell = DataCellNoIndex & {
  index: number
};

export type DataCellNoIndex = {
  color: string;
  name: string;
  nested: {
    prof: string;
  };
};

const data: DataCellNoIndex[] = [
  { color: 'red', name: 'Michał Osadnik', nested: { prof: 'ABC' } },
  { color: 'blue', name: 'Beata Kozidrak', nested: { prof: 'BC' } },
  { color: 'green', name: 'Klucha Sierpowska', nested: { prof: 'ABC' } },
  { color: 'yellow', name: 'Adam Małysz', nested: { prof: 'ABCDE' } },
  { color: 'violet', name: 'Karol Wadowicz', nested: { prof: 'ABCEDEF' } },
  { color: 'purple', name: 'Jan Wojtyłowicz', nested: { prof: 'ABCDE' } },
];

// const data2: DataCell[] = [
//   { name: 'Michał Osadnik', nested: { prof: 'X' } },
//   { name: 'Beata Kozidrak', nested: { prof: 'X' } },
//   { name: 'Klucha Sierpowska', nested: { prof: 'V' } },
//   { name: 'Adam Małysz', nested: { prof: 'X' } },
//   { name: 'Karol Wadowicz', nested: { prof: 'X' } },
//   { name: 'Jan Wojtyłowicz', nested: { prof: 'X' } },
// ];

let moreData: DataCell[] = [];

for (let i = 0; i < 100; i++) {

  moreData = moreData.concat(data.map((d, i) => ({ ...d, name: 'x' + (moreData.length + i) + d.name ,  index: moreData.length + i })));
}

const data2: DataCellNoIndex[] = [
  { color: 'red', name: 'Michał OsaSDFdnik', nested: { prof: 'X' } },
  { color: 'blue', name: 'Beata KozidAFrak', nested: { prof: 'X' } },
  { color: 'green', name: 'Klucha SieSFrpowska', nested: { prof: 'V' } },
  { color: 'yellow', name: 'AdaDFm Małysz', nested: { prof: 'X' } },
  { color: 'violet', name: 'KarSFol Wadowicz', nested: { prof: 'X' } },
  { color: 'purple', name: 'Jan Wo|SFDjtyłowicz', nested: { prof: 'X' } },
];

// const data2: DataCell[] = [
//   { name: 'Michał Osadnik', nested: { prof: 'X' } },
//   { name: 'Beata Kozidrak', nested: { prof: 'X' } },
//   { name: 'Klucha Sierpowska', nested: { prof: 'V' } },
//   { name: 'Adam Małysz', nested: { prof: 'X' } },
//   { name: 'Karol Wadowicz', nested: { prof: 'X' } },
//   { name: 'Jan Wojtyłowicz', nested: { prof: 'X' } },
// ];

let moreData2: DataCell[] = [];

for (let i = 0; i < 1000; i++) {

  moreData2 = moreData2.concat(data2.map((d, i) => ({ ...d, index: moreData.length + i })));

}

// let moreData2: DataCell[] = [];
//
// for (let i = 0; i < 100; i++) {
//   moreData2 = data.concat(moreData);
// }

export { moreData as data, moreData2 as data2 };


type DataWrapper = {
  data: DataCell
  type: "data"
}
