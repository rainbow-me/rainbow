import { Dimensions } from 'react-native';
import { EMOJI_FONT_SIZE_OFFSET, EMOJIS_CONTAINER_HORIZONTAL_MARGIN } from '../constants';

const { width } = Dimensions.get('screen');

export default function getEmojiCellsProperties(columnsCount: number) {
  const columnSize = width / columnsCount;
  const fontSize = Math.ceil(columnSize) - EMOJI_FONT_SIZE_OFFSET;
  const cellSize = (width - EMOJIS_CONTAINER_HORIZONTAL_MARGIN * 2) / columnsCount;

  return {
    cellSize,
    fontSize,
  };
}
