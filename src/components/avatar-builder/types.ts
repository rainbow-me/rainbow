export interface EmojiCategory {
  getTitle: () => string;
  icon: string;
  index: number;
  name: string;
  width: number;
}

export interface EmojiEntry {
  char: string;
  categoryId: number;
}
