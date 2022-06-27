export interface EmojiCategory {
  getTitle: () => string;
  icon: string;
  index: number;
  name: string;
  width: number;
}

export interface EmojiEntry {
  name: string | null;
  unified: string;
  non_qualified: string | null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  short_name: string;
  short_names: string[];
  text: string | null;
  texts: string[] | null;
  category: string;
  sort_order: number;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_facebook: boolean;
  skin_variations?: Record<
    string,
    {
      unified: string;
      image: string;
      sheet_x: number;
      sheet_y: number;
      has_img_apple: boolean;
      has_img_google: boolean;
      has_img_twitter: boolean;
      has_img_facebook: boolean;
    }
  >;
  obsoletes?: string;
  obsoleted_by?: string;
}
