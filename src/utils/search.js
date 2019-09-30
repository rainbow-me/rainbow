import { startsWith, toLower } from 'lodash';

export const filterList = (
  list,
  searchPhrase,
  searchParameter = false,
  separator = ' '
) => {
  const filteredList = [];
  if (list && searchPhrase.length > 0) {
    for (let i = 0; i < list.length; i++) {
      const searchedItem = searchParameter ? list[i][searchParameter] : list[i];
      const splitedWordList = (searchedItem || '').split(separator);
      splitedWordList.push(searchedItem);
      for (let j = 0; j < splitedWordList.length; j++) {
        if (startsWith(toLower(splitedWordList[j]), toLower(searchPhrase))) {
          filteredList.push(list[i]);
          break;
        }
      }
    }
  } else {
    return list;
  }
  return filteredList;
};
