import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  Dimension: any;
  HexColor: any;
  JSON: any;
  Quality: any;
};

export type Asset = {
  __typename?: 'Asset';
  address: Scalars['String'];
  decimals: Scalars['Int'];
  name: Scalars['String'];
  symbol: Scalars['String'];
};

export type AssetAmount = {
  __typename?: 'AssetAmount';
  decimal: Scalars['Float'];
  raw: Scalars['String'];
  usd: Scalars['Float'];
};

export type AssetCollection = {
  __typename?: 'AssetCollection';
  items: Array<Maybe<ContentfulAsset>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type AssetFilter = {
  AND?: InputMaybe<Array<InputMaybe<AssetFilter>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  contentType?: InputMaybe<Scalars['String']>;
  contentType_contains?: InputMaybe<Scalars['String']>;
  contentType_exists?: InputMaybe<Scalars['Boolean']>;
  contentType_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contentType_not?: InputMaybe<Scalars['String']>;
  contentType_not_contains?: InputMaybe<Scalars['String']>;
  contentType_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  description?: InputMaybe<Scalars['String']>;
  description_contains?: InputMaybe<Scalars['String']>;
  description_exists?: InputMaybe<Scalars['Boolean']>;
  description_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  description_not?: InputMaybe<Scalars['String']>;
  description_not_contains?: InputMaybe<Scalars['String']>;
  description_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  fileName?: InputMaybe<Scalars['String']>;
  fileName_contains?: InputMaybe<Scalars['String']>;
  fileName_exists?: InputMaybe<Scalars['Boolean']>;
  fileName_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  fileName_not?: InputMaybe<Scalars['String']>;
  fileName_not_contains?: InputMaybe<Scalars['String']>;
  fileName_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  height?: InputMaybe<Scalars['Int']>;
  height_exists?: InputMaybe<Scalars['Boolean']>;
  height_gt?: InputMaybe<Scalars['Int']>;
  height_gte?: InputMaybe<Scalars['Int']>;
  height_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  height_lt?: InputMaybe<Scalars['Int']>;
  height_lte?: InputMaybe<Scalars['Int']>;
  height_not?: InputMaybe<Scalars['Int']>;
  height_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  OR?: InputMaybe<Array<InputMaybe<AssetFilter>>>;
  size?: InputMaybe<Scalars['Int']>;
  size_exists?: InputMaybe<Scalars['Boolean']>;
  size_gt?: InputMaybe<Scalars['Int']>;
  size_gte?: InputMaybe<Scalars['Int']>;
  size_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  size_lt?: InputMaybe<Scalars['Int']>;
  size_lte?: InputMaybe<Scalars['Int']>;
  size_not?: InputMaybe<Scalars['Int']>;
  size_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  sys?: InputMaybe<SysFilter>;
  title?: InputMaybe<Scalars['String']>;
  title_contains?: InputMaybe<Scalars['String']>;
  title_exists?: InputMaybe<Scalars['Boolean']>;
  title_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title_not?: InputMaybe<Scalars['String']>;
  title_not_contains?: InputMaybe<Scalars['String']>;
  title_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  url?: InputMaybe<Scalars['String']>;
  url_contains?: InputMaybe<Scalars['String']>;
  url_exists?: InputMaybe<Scalars['Boolean']>;
  url_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  url_not?: InputMaybe<Scalars['String']>;
  url_not_contains?: InputMaybe<Scalars['String']>;
  url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  width?: InputMaybe<Scalars['Int']>;
  width_exists?: InputMaybe<Scalars['Boolean']>;
  width_gt?: InputMaybe<Scalars['Int']>;
  width_gte?: InputMaybe<Scalars['Int']>;
  width_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  width_lt?: InputMaybe<Scalars['Int']>;
  width_lte?: InputMaybe<Scalars['Int']>;
  width_not?: InputMaybe<Scalars['Int']>;
  width_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
};

export type AssetLinkingCollections = {
  __typename?: 'AssetLinkingCollections';
  dropCollection?: Maybe<DropCollection>;
  entryCollection?: Maybe<EntryCollection>;
  personCollection?: Maybe<PersonCollection>;
  postCollection?: Maybe<PostCollection>;
  promoSheetCollection?: Maybe<PromoSheetCollection>;
};


export type AssetLinkingCollectionsDropCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<AssetLinkingCollectionsDropCollectionOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};


export type AssetLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};


export type AssetLinkingCollectionsPersonCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<AssetLinkingCollectionsPersonCollectionOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};


export type AssetLinkingCollectionsPostCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<AssetLinkingCollectionsPostCollectionOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};


export type AssetLinkingCollectionsPromoSheetCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<AssetLinkingCollectionsPromoSheetCollectionOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum AssetLinkingCollectionsDropCollectionOrder {
  BackgroundColorAsc = 'backgroundColor_ASC',
  BackgroundColorDesc = 'backgroundColor_DESC',
  ButtonColorAsc = 'buttonColor_ASC',
  ButtonColorDesc = 'buttonColor_DESC',
  ButtonShadowColorAsc = 'buttonShadowColor_ASC',
  ButtonShadowColorDesc = 'buttonShadowColor_DESC',
  ButtonTextColorAsc = 'buttonTextColor_ASC',
  ButtonTextColorDesc = 'buttonTextColor_DESC',
  ContractAddressAsc = 'contractAddress_ASC',
  ContractAddressDesc = 'contractAddress_DESC',
  DownloadLinkAsc = 'downloadLink_ASC',
  DownloadLinkDesc = 'downloadLink_DESC',
  FirstProductHighlightBackgroundAsc = 'firstProductHighlightBackground_ASC',
  FirstProductHighlightBackgroundDesc = 'firstProductHighlightBackground_DESC',
  FirstProductHighlightTextColorAsc = 'firstProductHighlightTextColor_ASC',
  FirstProductHighlightTextColorDesc = 'firstProductHighlightTextColor_DESC',
  FirstProductHighlightTitleAsc = 'firstProductHighlightTitle_ASC',
  FirstProductHighlightTitleDesc = 'firstProductHighlightTitle_DESC',
  GradientColorAsc = 'gradientColor_ASC',
  GradientColorDesc = 'gradientColor_DESC',
  LinearGradientColorAsc = 'linearGradientColor_ASC',
  LinearGradientColorDesc = 'linearGradientColor_DESC',
  LinkColorAsc = 'linkColor_ASC',
  LinkColorDesc = 'linkColor_DESC',
  PartnerLinkAsc = 'partnerLink_ASC',
  PartnerLinkDesc = 'partnerLink_DESC',
  PartnerTitleAsc = 'partnerTitle_ASC',
  PartnerTitleDesc = 'partnerTitle_DESC',
  PresaleNameAsc = 'presaleName_ASC',
  PresaleNameDesc = 'presaleName_DESC',
  RadialGradientColorAsc = 'radialGradientColor_ASC',
  RadialGradientColorDesc = 'radialGradientColor_DESC',
  SecondProductHighlightBackgroundAsc = 'secondProductHighlightBackground_ASC',
  SecondProductHighlightBackgroundDesc = 'secondProductHighlightBackground_DESC',
  SecondProductHighlightTextColorAsc = 'secondProductHighlightTextColor_ASC',
  SecondProductHighlightTextColorDesc = 'secondProductHighlightTextColor_DESC',
  SecondProductHighlightTitleAsc = 'secondProductHighlightTitle_ASC',
  SecondProductHighlightTitleDesc = 'secondProductHighlightTitle_DESC',
  ShowFooterAsc = 'showFooter_ASC',
  ShowFooterDesc = 'showFooter_DESC',
  SlugAsc = 'slug_ASC',
  SlugDesc = 'slug_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TextColorAsc = 'textColor_ASC',
  TextColorDesc = 'textColor_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  UnlockableTitleAsc = 'unlockableTitle_ASC',
  UnlockableTitleDesc = 'unlockableTitle_DESC'
}

export enum AssetLinkingCollectionsPersonCollectionOrder {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export enum AssetLinkingCollectionsPostCollectionOrder {
  DateAsc = 'date_ASC',
  DateDesc = 'date_DESC',
  SeoTitleAsc = 'seoTitle_ASC',
  SeoTitleDesc = 'seoTitle_DESC',
  SlugAsc = 'slug_ASC',
  SlugDesc = 'slug_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC'
}

export enum AssetLinkingCollectionsPromoSheetCollectionOrder {
  AccentColorAsc = 'accentColor_ASC',
  AccentColorDesc = 'accentColor_DESC',
  BackgroundColorAsc = 'backgroundColor_ASC',
  BackgroundColorDesc = 'backgroundColor_DESC',
  CampaignKeyAsc = 'campaignKey_ASC',
  CampaignKeyDesc = 'campaignKey_DESC',
  HeaderImageAspectRatioAsc = 'headerImageAspectRatio_ASC',
  HeaderImageAspectRatioDesc = 'headerImageAspectRatio_DESC',
  LaunchDateAsc = 'launchDate_ASC',
  LaunchDateDesc = 'launchDate_DESC',
  PriorityAsc = 'priority_ASC',
  PriorityDesc = 'priority_DESC',
  SheetHandleColorAsc = 'sheetHandleColor_ASC',
  SheetHandleColorDesc = 'sheetHandleColor_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export enum AssetOrder {
  ContentTypeAsc = 'contentType_ASC',
  ContentTypeDesc = 'contentType_DESC',
  FileNameAsc = 'fileName_ASC',
  FileNameDesc = 'fileName_DESC',
  HeightAsc = 'height_ASC',
  HeightDesc = 'height_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  UrlAsc = 'url_ASC',
  UrlDesc = 'url_DESC',
  WidthAsc = 'width_ASC',
  WidthDesc = 'width_DESC'
}

export type Card = Entry & {
  __typename?: 'Card';
  accentColor?: Maybe<Scalars['String']>;
  backgroundColor?: Maybe<Scalars['String']>;
  borderRadius?: Maybe<Scalars['Int']>;
  cardKey?: Maybe<Scalars['String']>;
  contentfulMetadata: ContentfulMetadata;
  dismissable?: Maybe<Scalars['Boolean']>;
  imageCollection?: Maybe<AssetCollection>;
  imageIcon?: Maybe<Scalars['String']>;
  imageRadius?: Maybe<Scalars['Int']>;
  index?: Maybe<Scalars['Int']>;
  linkedFrom?: Maybe<CardLinkingCollections>;
  padding?: Maybe<Scalars['Int']>;
  placement?: Maybe<Scalars['String']>;
  primaryButton?: Maybe<Scalars['JSON']>;
  subtitle?: Maybe<Scalars['JSON']>;
  subtitleColor?: Maybe<Scalars['String']>;
  sys: Sys;
  title?: Maybe<Scalars['JSON']>;
  titleColor?: Maybe<Scalars['String']>;
};


export type CardAccentColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardBackgroundColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardBorderRadiusArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardCardKeyArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardDismissableArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardImageCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};


export type CardImageIconArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardImageRadiusArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardIndexArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type CardPaddingArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardPlacementArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardPrimaryButtonArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardSubtitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardSubtitleColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type CardTitleColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type CardCollection = {
  __typename?: 'CardCollection';
  items: Array<Maybe<Card>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type CardFilter = {
  accentColor?: InputMaybe<Scalars['String']>;
  accentColor_contains?: InputMaybe<Scalars['String']>;
  accentColor_exists?: InputMaybe<Scalars['Boolean']>;
  accentColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  accentColor_not?: InputMaybe<Scalars['String']>;
  accentColor_not_contains?: InputMaybe<Scalars['String']>;
  accentColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  AND?: InputMaybe<Array<InputMaybe<CardFilter>>>;
  backgroundColor?: InputMaybe<Scalars['String']>;
  backgroundColor_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_exists?: InputMaybe<Scalars['Boolean']>;
  backgroundColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  backgroundColor_not?: InputMaybe<Scalars['String']>;
  backgroundColor_not_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  borderRadius?: InputMaybe<Scalars['Int']>;
  borderRadius_exists?: InputMaybe<Scalars['Boolean']>;
  borderRadius_gt?: InputMaybe<Scalars['Int']>;
  borderRadius_gte?: InputMaybe<Scalars['Int']>;
  borderRadius_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  borderRadius_lt?: InputMaybe<Scalars['Int']>;
  borderRadius_lte?: InputMaybe<Scalars['Int']>;
  borderRadius_not?: InputMaybe<Scalars['Int']>;
  borderRadius_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  cardKey?: InputMaybe<Scalars['String']>;
  cardKey_contains?: InputMaybe<Scalars['String']>;
  cardKey_exists?: InputMaybe<Scalars['Boolean']>;
  cardKey_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  cardKey_not?: InputMaybe<Scalars['String']>;
  cardKey_not_contains?: InputMaybe<Scalars['String']>;
  cardKey_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  dismissable?: InputMaybe<Scalars['Boolean']>;
  dismissable_exists?: InputMaybe<Scalars['Boolean']>;
  dismissable_not?: InputMaybe<Scalars['Boolean']>;
  imageCollection_exists?: InputMaybe<Scalars['Boolean']>;
  imageIcon?: InputMaybe<Scalars['String']>;
  imageIcon_contains?: InputMaybe<Scalars['String']>;
  imageIcon_exists?: InputMaybe<Scalars['Boolean']>;
  imageIcon_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  imageIcon_not?: InputMaybe<Scalars['String']>;
  imageIcon_not_contains?: InputMaybe<Scalars['String']>;
  imageIcon_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  imageRadius?: InputMaybe<Scalars['Int']>;
  imageRadius_exists?: InputMaybe<Scalars['Boolean']>;
  imageRadius_gt?: InputMaybe<Scalars['Int']>;
  imageRadius_gte?: InputMaybe<Scalars['Int']>;
  imageRadius_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  imageRadius_lt?: InputMaybe<Scalars['Int']>;
  imageRadius_lte?: InputMaybe<Scalars['Int']>;
  imageRadius_not?: InputMaybe<Scalars['Int']>;
  imageRadius_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  index?: InputMaybe<Scalars['Int']>;
  index_exists?: InputMaybe<Scalars['Boolean']>;
  index_gt?: InputMaybe<Scalars['Int']>;
  index_gte?: InputMaybe<Scalars['Int']>;
  index_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  index_lt?: InputMaybe<Scalars['Int']>;
  index_lte?: InputMaybe<Scalars['Int']>;
  index_not?: InputMaybe<Scalars['Int']>;
  index_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  OR?: InputMaybe<Array<InputMaybe<CardFilter>>>;
  padding?: InputMaybe<Scalars['Int']>;
  padding_exists?: InputMaybe<Scalars['Boolean']>;
  padding_gt?: InputMaybe<Scalars['Int']>;
  padding_gte?: InputMaybe<Scalars['Int']>;
  padding_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  padding_lt?: InputMaybe<Scalars['Int']>;
  padding_lte?: InputMaybe<Scalars['Int']>;
  padding_not?: InputMaybe<Scalars['Int']>;
  padding_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  placement?: InputMaybe<Scalars['String']>;
  placement_contains?: InputMaybe<Scalars['String']>;
  placement_exists?: InputMaybe<Scalars['Boolean']>;
  placement_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  placement_not?: InputMaybe<Scalars['String']>;
  placement_not_contains?: InputMaybe<Scalars['String']>;
  placement_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  primaryButton_exists?: InputMaybe<Scalars['Boolean']>;
  subtitle_exists?: InputMaybe<Scalars['Boolean']>;
  subtitleColor?: InputMaybe<Scalars['String']>;
  subtitleColor_contains?: InputMaybe<Scalars['String']>;
  subtitleColor_exists?: InputMaybe<Scalars['Boolean']>;
  subtitleColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  subtitleColor_not?: InputMaybe<Scalars['String']>;
  subtitleColor_not_contains?: InputMaybe<Scalars['String']>;
  subtitleColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sys?: InputMaybe<SysFilter>;
  title_exists?: InputMaybe<Scalars['Boolean']>;
  titleColor?: InputMaybe<Scalars['String']>;
  titleColor_contains?: InputMaybe<Scalars['String']>;
  titleColor_exists?: InputMaybe<Scalars['Boolean']>;
  titleColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  titleColor_not?: InputMaybe<Scalars['String']>;
  titleColor_not_contains?: InputMaybe<Scalars['String']>;
  titleColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type CardLinkingCollections = {
  __typename?: 'CardLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type CardLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum CardOrder {
  AccentColorAsc = 'accentColor_ASC',
  AccentColorDesc = 'accentColor_DESC',
  BackgroundColorAsc = 'backgroundColor_ASC',
  BackgroundColorDesc = 'backgroundColor_DESC',
  BorderRadiusAsc = 'borderRadius_ASC',
  BorderRadiusDesc = 'borderRadius_DESC',
  CardKeyAsc = 'cardKey_ASC',
  CardKeyDesc = 'cardKey_DESC',
  DismissableAsc = 'dismissable_ASC',
  DismissableDesc = 'dismissable_DESC',
  ImageIconAsc = 'imageIcon_ASC',
  ImageIconDesc = 'imageIcon_DESC',
  ImageRadiusAsc = 'imageRadius_ASC',
  ImageRadiusDesc = 'imageRadius_DESC',
  IndexAsc = 'index_ASC',
  IndexDesc = 'index_DESC',
  PaddingAsc = 'padding_ASC',
  PaddingDesc = 'padding_DESC',
  PlacementAsc = 'placement_ASC',
  PlacementDesc = 'placement_DESC',
  SubtitleColorAsc = 'subtitleColor_ASC',
  SubtitleColorDesc = 'subtitleColor_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TitleColorAsc = 'titleColor_ASC',
  TitleColorDesc = 'titleColor_DESC'
}

export type ContentfulAsset = {
  __typename?: 'ContentfulAsset';
  contentfulMetadata: ContentfulMetadata;
  contentType?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  fileName?: Maybe<Scalars['String']>;
  height?: Maybe<Scalars['Int']>;
  linkedFrom?: Maybe<AssetLinkingCollections>;
  size?: Maybe<Scalars['Int']>;
  sys: Sys;
  title?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  width?: Maybe<Scalars['Int']>;
};


export type ContentfulAssetContentTypeArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetFileNameArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetHeightArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type ContentfulAssetSizeArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type ContentfulAssetUrlArgs = {
  locale?: InputMaybe<Scalars['String']>;
  transform?: InputMaybe<ImageTransformOptions>;
};


export type ContentfulAssetWidthArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type ContentfulMetadata = {
  __typename?: 'ContentfulMetadata';
  tags: Array<Maybe<ContentfulTag>>;
};

export type ContentfulMetadataFilter = {
  tags?: InputMaybe<ContentfulMetadataTagsFilter>;
  tags_exists?: InputMaybe<Scalars['Boolean']>;
};

export type ContentfulMetadataTagsFilter = {
  id_contains_all?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  id_contains_none?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  id_contains_some?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type ContentfulTag = {
  __typename?: 'ContentfulTag';
  id?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type Drop = Entry & {
  __typename?: 'Drop';
  backgroundColor?: Maybe<Scalars['String']>;
  backgroundImage?: Maybe<ContentfulAsset>;
  buttonColor?: Maybe<Scalars['String']>;
  buttonShadowColor?: Maybe<Scalars['String']>;
  buttonTextColor?: Maybe<Scalars['String']>;
  contentfulMetadata: ContentfulMetadata;
  contractAddress?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  downloadLink?: Maybe<Scalars['String']>;
  dropAsset?: Maybe<ContentfulAsset>;
  firstProductHighlightBackground?: Maybe<Scalars['String']>;
  firstProductHighlightDescription?: Maybe<Scalars['String']>;
  firstProductHighlightImage?: Maybe<ContentfulAsset>;
  firstProductHighlightTextColor?: Maybe<Scalars['String']>;
  firstProductHighlightTitle?: Maybe<Scalars['String']>;
  gradientColor?: Maybe<Scalars['String']>;
  linearGradientColor?: Maybe<Scalars['String']>;
  linkColor?: Maybe<Scalars['String']>;
  linkedFrom?: Maybe<DropLinkingCollections>;
  metaImage?: Maybe<ContentfulAsset>;
  partnerAsset?: Maybe<ContentfulAsset>;
  partnerDescription?: Maybe<Scalars['String']>;
  partnerLink?: Maybe<Scalars['String']>;
  partnerTitle?: Maybe<Scalars['String']>;
  presaleName?: Maybe<Scalars['String']>;
  radialGradientColor?: Maybe<Scalars['String']>;
  secondProductHighlightBackground?: Maybe<Scalars['String']>;
  secondProductHighlightDescription?: Maybe<Scalars['String']>;
  secondProductHighlightImage?: Maybe<ContentfulAsset>;
  secondProductHighlightTextColor?: Maybe<Scalars['String']>;
  secondProductHighlightTitle?: Maybe<Scalars['String']>;
  showFooter?: Maybe<Scalars['Boolean']>;
  slug?: Maybe<Scalars['String']>;
  sys: Sys;
  textColor?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  unlockableAsset?: Maybe<ContentfulAsset>;
  unlockableDescription?: Maybe<Scalars['String']>;
  unlockableTitle?: Maybe<Scalars['String']>;
};


export type DropBackgroundColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropBackgroundImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropButtonColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropButtonShadowColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropButtonTextColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropContractAddressArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropDownloadLinkArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropDropAssetArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropFirstProductHighlightBackgroundArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropFirstProductHighlightDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropFirstProductHighlightImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropFirstProductHighlightTextColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropFirstProductHighlightTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropGradientColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropLinearGradientColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropLinkColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type DropMetaImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropPartnerAssetArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropPartnerDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropPartnerLinkArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropPartnerTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropPresaleNameArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropRadialGradientColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropSecondProductHighlightBackgroundArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropSecondProductHighlightDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropSecondProductHighlightImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropSecondProductHighlightTextColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropSecondProductHighlightTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropShowFooterArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropSlugArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropTextColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropUnlockableAssetArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type DropUnlockableDescriptionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type DropUnlockableTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type DropCollection = {
  __typename?: 'DropCollection';
  items: Array<Maybe<Drop>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type DropFilter = {
  AND?: InputMaybe<Array<InputMaybe<DropFilter>>>;
  backgroundColor?: InputMaybe<Scalars['String']>;
  backgroundColor_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_exists?: InputMaybe<Scalars['Boolean']>;
  backgroundColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  backgroundColor_not?: InputMaybe<Scalars['String']>;
  backgroundColor_not_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  backgroundImage_exists?: InputMaybe<Scalars['Boolean']>;
  buttonColor?: InputMaybe<Scalars['String']>;
  buttonColor_contains?: InputMaybe<Scalars['String']>;
  buttonColor_exists?: InputMaybe<Scalars['Boolean']>;
  buttonColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  buttonColor_not?: InputMaybe<Scalars['String']>;
  buttonColor_not_contains?: InputMaybe<Scalars['String']>;
  buttonColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  buttonShadowColor?: InputMaybe<Scalars['String']>;
  buttonShadowColor_contains?: InputMaybe<Scalars['String']>;
  buttonShadowColor_exists?: InputMaybe<Scalars['Boolean']>;
  buttonShadowColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  buttonShadowColor_not?: InputMaybe<Scalars['String']>;
  buttonShadowColor_not_contains?: InputMaybe<Scalars['String']>;
  buttonShadowColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  buttonTextColor?: InputMaybe<Scalars['String']>;
  buttonTextColor_contains?: InputMaybe<Scalars['String']>;
  buttonTextColor_exists?: InputMaybe<Scalars['Boolean']>;
  buttonTextColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  buttonTextColor_not?: InputMaybe<Scalars['String']>;
  buttonTextColor_not_contains?: InputMaybe<Scalars['String']>;
  buttonTextColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  contractAddress?: InputMaybe<Scalars['String']>;
  contractAddress_contains?: InputMaybe<Scalars['String']>;
  contractAddress_exists?: InputMaybe<Scalars['Boolean']>;
  contractAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contractAddress_not?: InputMaybe<Scalars['String']>;
  contractAddress_not_contains?: InputMaybe<Scalars['String']>;
  contractAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  description?: InputMaybe<Scalars['String']>;
  description_contains?: InputMaybe<Scalars['String']>;
  description_exists?: InputMaybe<Scalars['Boolean']>;
  description_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  description_not?: InputMaybe<Scalars['String']>;
  description_not_contains?: InputMaybe<Scalars['String']>;
  description_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  downloadLink?: InputMaybe<Scalars['String']>;
  downloadLink_contains?: InputMaybe<Scalars['String']>;
  downloadLink_exists?: InputMaybe<Scalars['Boolean']>;
  downloadLink_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  downloadLink_not?: InputMaybe<Scalars['String']>;
  downloadLink_not_contains?: InputMaybe<Scalars['String']>;
  downloadLink_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  dropAsset_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightBackground?: InputMaybe<Scalars['String']>;
  firstProductHighlightBackground_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightBackground_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightBackground_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightBackground_not?: InputMaybe<Scalars['String']>;
  firstProductHighlightBackground_not_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightBackground_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightDescription?: InputMaybe<Scalars['String']>;
  firstProductHighlightDescription_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightDescription_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightDescription_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightDescription_not?: InputMaybe<Scalars['String']>;
  firstProductHighlightDescription_not_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightDescription_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightImage_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightTextColor?: InputMaybe<Scalars['String']>;
  firstProductHighlightTextColor_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightTextColor_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightTextColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightTextColor_not?: InputMaybe<Scalars['String']>;
  firstProductHighlightTextColor_not_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightTextColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightTitle?: InputMaybe<Scalars['String']>;
  firstProductHighlightTitle_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightTitle_exists?: InputMaybe<Scalars['Boolean']>;
  firstProductHighlightTitle_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  firstProductHighlightTitle_not?: InputMaybe<Scalars['String']>;
  firstProductHighlightTitle_not_contains?: InputMaybe<Scalars['String']>;
  firstProductHighlightTitle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  gradientColor?: InputMaybe<Scalars['String']>;
  gradientColor_contains?: InputMaybe<Scalars['String']>;
  gradientColor_exists?: InputMaybe<Scalars['Boolean']>;
  gradientColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  gradientColor_not?: InputMaybe<Scalars['String']>;
  gradientColor_not_contains?: InputMaybe<Scalars['String']>;
  gradientColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  linearGradientColor?: InputMaybe<Scalars['String']>;
  linearGradientColor_contains?: InputMaybe<Scalars['String']>;
  linearGradientColor_exists?: InputMaybe<Scalars['Boolean']>;
  linearGradientColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  linearGradientColor_not?: InputMaybe<Scalars['String']>;
  linearGradientColor_not_contains?: InputMaybe<Scalars['String']>;
  linearGradientColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  linkColor?: InputMaybe<Scalars['String']>;
  linkColor_contains?: InputMaybe<Scalars['String']>;
  linkColor_exists?: InputMaybe<Scalars['Boolean']>;
  linkColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  linkColor_not?: InputMaybe<Scalars['String']>;
  linkColor_not_contains?: InputMaybe<Scalars['String']>;
  linkColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  metaImage_exists?: InputMaybe<Scalars['Boolean']>;
  OR?: InputMaybe<Array<InputMaybe<DropFilter>>>;
  partnerAsset_exists?: InputMaybe<Scalars['Boolean']>;
  partnerDescription?: InputMaybe<Scalars['String']>;
  partnerDescription_contains?: InputMaybe<Scalars['String']>;
  partnerDescription_exists?: InputMaybe<Scalars['Boolean']>;
  partnerDescription_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  partnerDescription_not?: InputMaybe<Scalars['String']>;
  partnerDescription_not_contains?: InputMaybe<Scalars['String']>;
  partnerDescription_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  partnerLink?: InputMaybe<Scalars['String']>;
  partnerLink_contains?: InputMaybe<Scalars['String']>;
  partnerLink_exists?: InputMaybe<Scalars['Boolean']>;
  partnerLink_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  partnerLink_not?: InputMaybe<Scalars['String']>;
  partnerLink_not_contains?: InputMaybe<Scalars['String']>;
  partnerLink_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  partnerTitle?: InputMaybe<Scalars['String']>;
  partnerTitle_contains?: InputMaybe<Scalars['String']>;
  partnerTitle_exists?: InputMaybe<Scalars['Boolean']>;
  partnerTitle_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  partnerTitle_not?: InputMaybe<Scalars['String']>;
  partnerTitle_not_contains?: InputMaybe<Scalars['String']>;
  partnerTitle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  presaleName?: InputMaybe<Scalars['String']>;
  presaleName_contains?: InputMaybe<Scalars['String']>;
  presaleName_exists?: InputMaybe<Scalars['Boolean']>;
  presaleName_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  presaleName_not?: InputMaybe<Scalars['String']>;
  presaleName_not_contains?: InputMaybe<Scalars['String']>;
  presaleName_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  radialGradientColor?: InputMaybe<Scalars['String']>;
  radialGradientColor_contains?: InputMaybe<Scalars['String']>;
  radialGradientColor_exists?: InputMaybe<Scalars['Boolean']>;
  radialGradientColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  radialGradientColor_not?: InputMaybe<Scalars['String']>;
  radialGradientColor_not_contains?: InputMaybe<Scalars['String']>;
  radialGradientColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightBackground?: InputMaybe<Scalars['String']>;
  secondProductHighlightBackground_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightBackground_exists?: InputMaybe<Scalars['Boolean']>;
  secondProductHighlightBackground_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightBackground_not?: InputMaybe<Scalars['String']>;
  secondProductHighlightBackground_not_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightBackground_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightDescription?: InputMaybe<Scalars['String']>;
  secondProductHighlightDescription_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightDescription_exists?: InputMaybe<Scalars['Boolean']>;
  secondProductHighlightDescription_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightDescription_not?: InputMaybe<Scalars['String']>;
  secondProductHighlightDescription_not_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightDescription_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightImage_exists?: InputMaybe<Scalars['Boolean']>;
  secondProductHighlightTextColor?: InputMaybe<Scalars['String']>;
  secondProductHighlightTextColor_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightTextColor_exists?: InputMaybe<Scalars['Boolean']>;
  secondProductHighlightTextColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightTextColor_not?: InputMaybe<Scalars['String']>;
  secondProductHighlightTextColor_not_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightTextColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightTitle?: InputMaybe<Scalars['String']>;
  secondProductHighlightTitle_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightTitle_exists?: InputMaybe<Scalars['Boolean']>;
  secondProductHighlightTitle_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  secondProductHighlightTitle_not?: InputMaybe<Scalars['String']>;
  secondProductHighlightTitle_not_contains?: InputMaybe<Scalars['String']>;
  secondProductHighlightTitle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  showFooter?: InputMaybe<Scalars['Boolean']>;
  showFooter_exists?: InputMaybe<Scalars['Boolean']>;
  showFooter_not?: InputMaybe<Scalars['Boolean']>;
  slug?: InputMaybe<Scalars['String']>;
  slug_contains?: InputMaybe<Scalars['String']>;
  slug_exists?: InputMaybe<Scalars['Boolean']>;
  slug_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug_not?: InputMaybe<Scalars['String']>;
  slug_not_contains?: InputMaybe<Scalars['String']>;
  slug_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sys?: InputMaybe<SysFilter>;
  textColor?: InputMaybe<Scalars['String']>;
  textColor_contains?: InputMaybe<Scalars['String']>;
  textColor_exists?: InputMaybe<Scalars['Boolean']>;
  textColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  textColor_not?: InputMaybe<Scalars['String']>;
  textColor_not_contains?: InputMaybe<Scalars['String']>;
  textColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title?: InputMaybe<Scalars['String']>;
  title_contains?: InputMaybe<Scalars['String']>;
  title_exists?: InputMaybe<Scalars['Boolean']>;
  title_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title_not?: InputMaybe<Scalars['String']>;
  title_not_contains?: InputMaybe<Scalars['String']>;
  title_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  unlockableAsset_exists?: InputMaybe<Scalars['Boolean']>;
  unlockableDescription?: InputMaybe<Scalars['String']>;
  unlockableDescription_contains?: InputMaybe<Scalars['String']>;
  unlockableDescription_exists?: InputMaybe<Scalars['Boolean']>;
  unlockableDescription_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  unlockableDescription_not?: InputMaybe<Scalars['String']>;
  unlockableDescription_not_contains?: InputMaybe<Scalars['String']>;
  unlockableDescription_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  unlockableTitle?: InputMaybe<Scalars['String']>;
  unlockableTitle_contains?: InputMaybe<Scalars['String']>;
  unlockableTitle_exists?: InputMaybe<Scalars['Boolean']>;
  unlockableTitle_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  unlockableTitle_not?: InputMaybe<Scalars['String']>;
  unlockableTitle_not_contains?: InputMaybe<Scalars['String']>;
  unlockableTitle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type DropLinkingCollections = {
  __typename?: 'DropLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type DropLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum DropOrder {
  BackgroundColorAsc = 'backgroundColor_ASC',
  BackgroundColorDesc = 'backgroundColor_DESC',
  ButtonColorAsc = 'buttonColor_ASC',
  ButtonColorDesc = 'buttonColor_DESC',
  ButtonShadowColorAsc = 'buttonShadowColor_ASC',
  ButtonShadowColorDesc = 'buttonShadowColor_DESC',
  ButtonTextColorAsc = 'buttonTextColor_ASC',
  ButtonTextColorDesc = 'buttonTextColor_DESC',
  ContractAddressAsc = 'contractAddress_ASC',
  ContractAddressDesc = 'contractAddress_DESC',
  DownloadLinkAsc = 'downloadLink_ASC',
  DownloadLinkDesc = 'downloadLink_DESC',
  FirstProductHighlightBackgroundAsc = 'firstProductHighlightBackground_ASC',
  FirstProductHighlightBackgroundDesc = 'firstProductHighlightBackground_DESC',
  FirstProductHighlightTextColorAsc = 'firstProductHighlightTextColor_ASC',
  FirstProductHighlightTextColorDesc = 'firstProductHighlightTextColor_DESC',
  FirstProductHighlightTitleAsc = 'firstProductHighlightTitle_ASC',
  FirstProductHighlightTitleDesc = 'firstProductHighlightTitle_DESC',
  GradientColorAsc = 'gradientColor_ASC',
  GradientColorDesc = 'gradientColor_DESC',
  LinearGradientColorAsc = 'linearGradientColor_ASC',
  LinearGradientColorDesc = 'linearGradientColor_DESC',
  LinkColorAsc = 'linkColor_ASC',
  LinkColorDesc = 'linkColor_DESC',
  PartnerLinkAsc = 'partnerLink_ASC',
  PartnerLinkDesc = 'partnerLink_DESC',
  PartnerTitleAsc = 'partnerTitle_ASC',
  PartnerTitleDesc = 'partnerTitle_DESC',
  PresaleNameAsc = 'presaleName_ASC',
  PresaleNameDesc = 'presaleName_DESC',
  RadialGradientColorAsc = 'radialGradientColor_ASC',
  RadialGradientColorDesc = 'radialGradientColor_DESC',
  SecondProductHighlightBackgroundAsc = 'secondProductHighlightBackground_ASC',
  SecondProductHighlightBackgroundDesc = 'secondProductHighlightBackground_DESC',
  SecondProductHighlightTextColorAsc = 'secondProductHighlightTextColor_ASC',
  SecondProductHighlightTextColorDesc = 'secondProductHighlightTextColor_DESC',
  SecondProductHighlightTitleAsc = 'secondProductHighlightTitle_ASC',
  SecondProductHighlightTitleDesc = 'secondProductHighlightTitle_DESC',
  ShowFooterAsc = 'showFooter_ASC',
  ShowFooterDesc = 'showFooter_DESC',
  SlugAsc = 'slug_ASC',
  SlugDesc = 'slug_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TextColorAsc = 'textColor_ASC',
  TextColorDesc = 'textColor_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  UnlockableTitleAsc = 'unlockableTitle_ASC',
  UnlockableTitleDesc = 'unlockableTitle_DESC'
}

export type Entry = {
  contentfulMetadata: ContentfulMetadata;
  sys: Sys;
};

export type EntryCollection = {
  __typename?: 'EntryCollection';
  items: Array<Maybe<Entry>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type EntryFilter = {
  AND?: InputMaybe<Array<InputMaybe<EntryFilter>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  OR?: InputMaybe<Array<InputMaybe<EntryFilter>>>;
  sys?: InputMaybe<SysFilter>;
};

export enum EntryOrder {
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type FaqEntry = Entry & {
  __typename?: 'FaqEntry';
  answer?: Maybe<FaqEntryAnswer>;
  contentfulMetadata: ContentfulMetadata;
  featured?: Maybe<Scalars['Boolean']>;
  linkedFrom?: Maybe<FaqEntryLinkingCollections>;
  order?: Maybe<Scalars['Int']>;
  question?: Maybe<Scalars['String']>;
  sys: Sys;
};


export type FaqEntryAnswerArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type FaqEntryFeaturedArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type FaqEntryLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type FaqEntryOrderArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type FaqEntryQuestionArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type FaqEntryAnswer = {
  __typename?: 'FaqEntryAnswer';
  json: Scalars['JSON'];
  links: FaqEntryAnswerLinks;
};

export type FaqEntryAnswerAssets = {
  __typename?: 'FaqEntryAnswerAssets';
  block: Array<Maybe<ContentfulAsset>>;
  hyperlink: Array<Maybe<ContentfulAsset>>;
};

export type FaqEntryAnswerEntries = {
  __typename?: 'FaqEntryAnswerEntries';
  block: Array<Maybe<Entry>>;
  hyperlink: Array<Maybe<Entry>>;
  inline: Array<Maybe<Entry>>;
};

export type FaqEntryAnswerLinks = {
  __typename?: 'FaqEntryAnswerLinks';
  assets: FaqEntryAnswerAssets;
  entries: FaqEntryAnswerEntries;
  resources: FaqEntryAnswerResources;
};

export type FaqEntryAnswerResources = {
  __typename?: 'FaqEntryAnswerResources';
  block: Array<ResourceLink>;
  hyperlink: Array<ResourceLink>;
  inline: Array<ResourceLink>;
};

export type FaqEntryCollection = {
  __typename?: 'FaqEntryCollection';
  items: Array<Maybe<FaqEntry>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type FaqEntryFilter = {
  AND?: InputMaybe<Array<InputMaybe<FaqEntryFilter>>>;
  answer_contains?: InputMaybe<Scalars['String']>;
  answer_exists?: InputMaybe<Scalars['Boolean']>;
  answer_not_contains?: InputMaybe<Scalars['String']>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  featured?: InputMaybe<Scalars['Boolean']>;
  featured_exists?: InputMaybe<Scalars['Boolean']>;
  featured_not?: InputMaybe<Scalars['Boolean']>;
  OR?: InputMaybe<Array<InputMaybe<FaqEntryFilter>>>;
  order?: InputMaybe<Scalars['Int']>;
  order_exists?: InputMaybe<Scalars['Boolean']>;
  order_gt?: InputMaybe<Scalars['Int']>;
  order_gte?: InputMaybe<Scalars['Int']>;
  order_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  order_lt?: InputMaybe<Scalars['Int']>;
  order_lte?: InputMaybe<Scalars['Int']>;
  order_not?: InputMaybe<Scalars['Int']>;
  order_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  question?: InputMaybe<Scalars['String']>;
  question_contains?: InputMaybe<Scalars['String']>;
  question_exists?: InputMaybe<Scalars['Boolean']>;
  question_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  question_not?: InputMaybe<Scalars['String']>;
  question_not_contains?: InputMaybe<Scalars['String']>;
  question_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sys?: InputMaybe<SysFilter>;
};

export type FaqEntryLinkingCollections = {
  __typename?: 'FaqEntryLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type FaqEntryLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum FaqEntryOrder {
  FeaturedAsc = 'featured_ASC',
  FeaturedDesc = 'featured_DESC',
  OrderAsc = 'order_ASC',
  OrderDesc = 'order_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type FeaturedMint = Entry & {
  __typename?: 'FeaturedMint';
  chainId?: Maybe<Scalars['Int']>;
  contentfulMetadata: ContentfulMetadata;
  contractAddress?: Maybe<Scalars['String']>;
  linkedFrom?: Maybe<FeaturedMintLinkingCollections>;
  name?: Maybe<Scalars['String']>;
  sys: Sys;
};


export type FeaturedMintChainIdArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type FeaturedMintContractAddressArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type FeaturedMintLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type FeaturedMintNameArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type FeaturedMintCollection = {
  __typename?: 'FeaturedMintCollection';
  items: Array<Maybe<FeaturedMint>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type FeaturedMintFilter = {
  AND?: InputMaybe<Array<InputMaybe<FeaturedMintFilter>>>;
  chainId?: InputMaybe<Scalars['Int']>;
  chainId_exists?: InputMaybe<Scalars['Boolean']>;
  chainId_gt?: InputMaybe<Scalars['Int']>;
  chainId_gte?: InputMaybe<Scalars['Int']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']>;
  chainId_lte?: InputMaybe<Scalars['Int']>;
  chainId_not?: InputMaybe<Scalars['Int']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  contractAddress?: InputMaybe<Scalars['String']>;
  contractAddress_contains?: InputMaybe<Scalars['String']>;
  contractAddress_exists?: InputMaybe<Scalars['Boolean']>;
  contractAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contractAddress_not?: InputMaybe<Scalars['String']>;
  contractAddress_not_contains?: InputMaybe<Scalars['String']>;
  contractAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  name?: InputMaybe<Scalars['String']>;
  name_contains?: InputMaybe<Scalars['String']>;
  name_exists?: InputMaybe<Scalars['Boolean']>;
  name_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  name_not?: InputMaybe<Scalars['String']>;
  name_not_contains?: InputMaybe<Scalars['String']>;
  name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  OR?: InputMaybe<Array<InputMaybe<FeaturedMintFilter>>>;
  sys?: InputMaybe<SysFilter>;
};

export type FeaturedMintLinkingCollections = {
  __typename?: 'FeaturedMintLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type FeaturedMintLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum FeaturedMintOrder {
  ChainIdAsc = 'chainId_ASC',
  ChainIdDesc = 'chainId_DESC',
  ContractAddressAsc = 'contractAddress_ASC',
  ContractAddressDesc = 'contractAddress_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export enum ImageFormat {
  Avif = 'AVIF',
  Jpg = 'JPG',
  JpgProgressive = 'JPG_PROGRESSIVE',
  Png = 'PNG',
  Png8 = 'PNG8',
  Webp = 'WEBP'
}

export enum ImageResizeFocus {
  Bottom = 'BOTTOM',
  BottomLeft = 'BOTTOM_LEFT',
  BottomRight = 'BOTTOM_RIGHT',
  Center = 'CENTER',
  Face = 'FACE',
  Faces = 'FACES',
  Left = 'LEFT',
  Right = 'RIGHT',
  Top = 'TOP',
  TopLeft = 'TOP_LEFT',
  TopRight = 'TOP_RIGHT'
}

export enum ImageResizeStrategy {
  Crop = 'CROP',
  Fill = 'FILL',
  Fit = 'FIT',
  Pad = 'PAD',
  Scale = 'SCALE',
  Thumb = 'THUMB'
}

export type ImageTransformOptions = {
  backgroundColor?: InputMaybe<Scalars['HexColor']>;
  cornerRadius?: InputMaybe<Scalars['Int']>;
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Dimension']>;
  quality?: InputMaybe<Scalars['Quality']>;
  resizeFocus?: InputMaybe<ImageResizeFocus>;
  resizeStrategy?: InputMaybe<ImageResizeStrategy>;
  width?: InputMaybe<Scalars['Dimension']>;
};

export type MintableCollection = {
  __typename?: 'MintableCollection';
  addressesLastHour?: Maybe<Scalars['Int']>;
  chainId: Scalars['Int'];
  contract: Scalars['String'];
  contractAddress: Scalars['String'];
  deployer?: Maybe<Scalars['String']>;
  externalURL: Scalars['String'];
  firstEvent: Scalars['String'];
  imageMimeType?: Maybe<Scalars['String']>;
  imageURL?: Maybe<Scalars['String']>;
  lastEvent?: Maybe<Scalars['String']>;
  maxSupply?: Maybe<Scalars['String']>;
  mintsLastHour: Scalars['Int'];
  mintStatus: MintStatus;
  name: Scalars['String'];
  recentMints: Array<MintedNft>;
  totalMints: Scalars['Int'];
};

export type MintableCollectionResult = {
  __typename?: 'MintableCollectionResult';
  collection: MintableCollection;
};

export type MintableCollectionsResult = {
  __typename?: 'MintableCollectionsResult';
  collections: Array<MintableCollection>;
};

export type MintedNft = {
  __typename?: 'MintedNFT';
  imageURI?: Maybe<Scalars['String']>;
  mimeType?: Maybe<Scalars['String']>;
  mintTime?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  tokenID: Scalars['String'];
  value?: Maybe<Scalars['String']>;
};

export type MintStatus = {
  __typename?: 'MintStatus';
  isMintable: Scalars['Boolean'];
  price: Scalars['String'];
};

export type NftFloorPrice = {
  __typename?: 'NFTFloorPrice';
  amount: AssetAmount;
  paymentToken: Asset;
};

export type NftMarketplace = {
  __typename?: 'NFTMarketplace';
  imageUrl: Scalars['String'];
  name: Scalars['String'];
};

export type NftOffer = {
  __typename?: 'NFTOffer';
  createdAt: Scalars['Int'];
  feesPercentage: Scalars['Float'];
  floorDifferencePercentage: Scalars['Float'];
  floorPrice: NftFloorPrice;
  grossAmount: AssetAmount;
  marketplace: NftMarketplace;
  netAmount: AssetAmount;
  network: Scalars['String'];
  nft: PartialNft;
  paymentToken: Asset;
  royaltiesPercentage: Scalars['Float'];
  url: Scalars['String'];
  validUntil: Scalars['Int'];
};

export type PartialNft = {
  __typename?: 'PartialNFT';
  aspectRatio?: Maybe<Scalars['Float']>;
  collectionName: Scalars['String'];
  contractAddress: Scalars['String'];
  imageUrl: Scalars['String'];
  name: Scalars['String'];
  predominantColor?: Maybe<Scalars['String']>;
  tokenId: Scalars['String'];
  uniqueId: Scalars['String'];
};

export type Person = Entry & {
  __typename?: 'Person';
  contentfulMetadata: ContentfulMetadata;
  linkedFrom?: Maybe<PersonLinkingCollections>;
  name?: Maybe<Scalars['String']>;
  profilePic?: Maybe<ContentfulAsset>;
  sys: Sys;
};


export type PersonLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type PersonNameArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PersonProfilePicArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};

export type PersonCollection = {
  __typename?: 'PersonCollection';
  items: Array<Maybe<Person>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type PersonFilter = {
  AND?: InputMaybe<Array<InputMaybe<PersonFilter>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  name?: InputMaybe<Scalars['String']>;
  name_contains?: InputMaybe<Scalars['String']>;
  name_exists?: InputMaybe<Scalars['Boolean']>;
  name_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  name_not?: InputMaybe<Scalars['String']>;
  name_not_contains?: InputMaybe<Scalars['String']>;
  name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  OR?: InputMaybe<Array<InputMaybe<PersonFilter>>>;
  profilePic_exists?: InputMaybe<Scalars['Boolean']>;
  sys?: InputMaybe<SysFilter>;
};

export type PersonLinkingCollections = {
  __typename?: 'PersonLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type PersonLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum PersonOrder {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type PoapClaimResult = {
  __typename?: 'PoapClaimResult';
  error?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type PoapEvent = {
  __typename?: 'PoapEvent';
  createdAt: Scalars['String'];
  id: Scalars['Int'];
  imageUrl: Scalars['String'];
  name: Scalars['String'];
  qrHash?: Maybe<Scalars['String']>;
  secret?: Maybe<Scalars['String']>;
  secretWord?: Maybe<Scalars['String']>;
};

export type PointsTweetIntent = Entry & {
  __typename?: 'PointsTweetIntent';
  contentfulMetadata: ContentfulMetadata;
  key?: Maybe<Scalars['String']>;
  linkedFrom?: Maybe<PointsTweetIntentLinkingCollections>;
  sys: Sys;
  text?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  via?: Maybe<Scalars['String']>;
};


export type PointsTweetIntentKeyArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PointsTweetIntentLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type PointsTweetIntentTextArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PointsTweetIntentUrlArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PointsTweetIntentViaArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type PointsTweetIntentCollection = {
  __typename?: 'PointsTweetIntentCollection';
  items: Array<Maybe<PointsTweetIntent>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type PointsTweetIntentFilter = {
  AND?: InputMaybe<Array<InputMaybe<PointsTweetIntentFilter>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  key?: InputMaybe<Scalars['String']>;
  key_contains?: InputMaybe<Scalars['String']>;
  key_exists?: InputMaybe<Scalars['Boolean']>;
  key_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  key_not?: InputMaybe<Scalars['String']>;
  key_not_contains?: InputMaybe<Scalars['String']>;
  key_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  OR?: InputMaybe<Array<InputMaybe<PointsTweetIntentFilter>>>;
  sys?: InputMaybe<SysFilter>;
  text?: InputMaybe<Scalars['String']>;
  text_contains?: InputMaybe<Scalars['String']>;
  text_exists?: InputMaybe<Scalars['Boolean']>;
  text_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  text_not?: InputMaybe<Scalars['String']>;
  text_not_contains?: InputMaybe<Scalars['String']>;
  text_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  url?: InputMaybe<Scalars['String']>;
  url_contains?: InputMaybe<Scalars['String']>;
  url_exists?: InputMaybe<Scalars['Boolean']>;
  url_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  url_not?: InputMaybe<Scalars['String']>;
  url_not_contains?: InputMaybe<Scalars['String']>;
  url_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  via?: InputMaybe<Scalars['String']>;
  via_contains?: InputMaybe<Scalars['String']>;
  via_exists?: InputMaybe<Scalars['Boolean']>;
  via_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  via_not?: InputMaybe<Scalars['String']>;
  via_not_contains?: InputMaybe<Scalars['String']>;
  via_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type PointsTweetIntentLinkingCollections = {
  __typename?: 'PointsTweetIntentLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type PointsTweetIntentLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum PointsTweetIntentOrder {
  KeyAsc = 'key_ASC',
  KeyDesc = 'key_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TextAsc = 'text_ASC',
  TextDesc = 'text_DESC',
  UrlAsc = 'url_ASC',
  UrlDesc = 'url_DESC',
  ViaAsc = 'via_ASC',
  ViaDesc = 'via_DESC'
}

export type Post = Entry & {
  __typename?: 'Post';
  content?: Maybe<PostContent>;
  contentfulMetadata: ContentfulMetadata;
  coverImage?: Maybe<ContentfulAsset>;
  date?: Maybe<Scalars['DateTime']>;
  excerpt?: Maybe<Scalars['String']>;
  linkedFrom?: Maybe<PostLinkingCollections>;
  person?: Maybe<Entry>;
  seoTitle?: Maybe<Scalars['String']>;
  slug?: Maybe<Scalars['String']>;
  sys: Sys;
  title?: Maybe<Scalars['String']>;
};


export type PostContentArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PostCoverImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type PostDateArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PostExcerptArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PostLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type PostPersonArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type PostSeoTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PostSlugArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PostTitleArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type PostCollection = {
  __typename?: 'PostCollection';
  items: Array<Maybe<Post>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type PostContent = {
  __typename?: 'PostContent';
  json: Scalars['JSON'];
  links: PostContentLinks;
};

export type PostContentAssets = {
  __typename?: 'PostContentAssets';
  block: Array<Maybe<ContentfulAsset>>;
  hyperlink: Array<Maybe<ContentfulAsset>>;
};

export type PostContentEntries = {
  __typename?: 'PostContentEntries';
  block: Array<Maybe<Entry>>;
  hyperlink: Array<Maybe<Entry>>;
  inline: Array<Maybe<Entry>>;
};

export type PostContentLinks = {
  __typename?: 'PostContentLinks';
  assets: PostContentAssets;
  entries: PostContentEntries;
  resources: PostContentResources;
};

export type PostContentResources = {
  __typename?: 'PostContentResources';
  block: Array<ResourceLink>;
  hyperlink: Array<ResourceLink>;
  inline: Array<ResourceLink>;
};

export type PostFilter = {
  AND?: InputMaybe<Array<InputMaybe<PostFilter>>>;
  content_contains?: InputMaybe<Scalars['String']>;
  content_exists?: InputMaybe<Scalars['Boolean']>;
  content_not_contains?: InputMaybe<Scalars['String']>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  coverImage_exists?: InputMaybe<Scalars['Boolean']>;
  date?: InputMaybe<Scalars['DateTime']>;
  date_exists?: InputMaybe<Scalars['Boolean']>;
  date_gt?: InputMaybe<Scalars['DateTime']>;
  date_gte?: InputMaybe<Scalars['DateTime']>;
  date_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  date_lt?: InputMaybe<Scalars['DateTime']>;
  date_lte?: InputMaybe<Scalars['DateTime']>;
  date_not?: InputMaybe<Scalars['DateTime']>;
  date_not_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  excerpt?: InputMaybe<Scalars['String']>;
  excerpt_contains?: InputMaybe<Scalars['String']>;
  excerpt_exists?: InputMaybe<Scalars['Boolean']>;
  excerpt_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  excerpt_not?: InputMaybe<Scalars['String']>;
  excerpt_not_contains?: InputMaybe<Scalars['String']>;
  excerpt_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  OR?: InputMaybe<Array<InputMaybe<PostFilter>>>;
  person_exists?: InputMaybe<Scalars['Boolean']>;
  seoTitle?: InputMaybe<Scalars['String']>;
  seoTitle_contains?: InputMaybe<Scalars['String']>;
  seoTitle_exists?: InputMaybe<Scalars['Boolean']>;
  seoTitle_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  seoTitle_not?: InputMaybe<Scalars['String']>;
  seoTitle_not_contains?: InputMaybe<Scalars['String']>;
  seoTitle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug?: InputMaybe<Scalars['String']>;
  slug_contains?: InputMaybe<Scalars['String']>;
  slug_exists?: InputMaybe<Scalars['Boolean']>;
  slug_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  slug_not?: InputMaybe<Scalars['String']>;
  slug_not_contains?: InputMaybe<Scalars['String']>;
  slug_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sys?: InputMaybe<SysFilter>;
  title?: InputMaybe<Scalars['String']>;
  title_contains?: InputMaybe<Scalars['String']>;
  title_exists?: InputMaybe<Scalars['Boolean']>;
  title_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title_not?: InputMaybe<Scalars['String']>;
  title_not_contains?: InputMaybe<Scalars['String']>;
  title_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type PostLinkingCollections = {
  __typename?: 'PostLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type PostLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum PostOrder {
  DateAsc = 'date_ASC',
  DateDesc = 'date_DESC',
  SeoTitleAsc = 'seoTitle_ASC',
  SeoTitleDesc = 'seoTitle_DESC',
  SlugAsc = 'slug_ASC',
  SlugDesc = 'slug_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC'
}

export type PromoSheet = Entry & {
  __typename?: 'PromoSheet';
  accentColor?: Maybe<Scalars['String']>;
  actions?: Maybe<Scalars['JSON']>;
  backgroundColor?: Maybe<Scalars['String']>;
  backgroundImage?: Maybe<ContentfulAsset>;
  campaignKey?: Maybe<Scalars['String']>;
  contentfulMetadata: ContentfulMetadata;
  header?: Maybe<Scalars['JSON']>;
  headerImage?: Maybe<ContentfulAsset>;
  headerImageAspectRatio?: Maybe<Scalars['Float']>;
  items?: Maybe<Scalars['JSON']>;
  launchDate?: Maybe<Scalars['DateTime']>;
  linkedFrom?: Maybe<PromoSheetLinkingCollections>;
  primaryButtonProps?: Maybe<Scalars['JSON']>;
  priority?: Maybe<Scalars['Int']>;
  secondaryButtonProps?: Maybe<Scalars['JSON']>;
  sheetHandleColor?: Maybe<Scalars['String']>;
  subHeader?: Maybe<Scalars['JSON']>;
  sys: Sys;
};


export type PromoSheetAccentColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetActionsArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetBackgroundColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetBackgroundImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type PromoSheetCampaignKeyArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetHeaderArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetHeaderImageArgs = {
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type PromoSheetHeaderImageAspectRatioArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetItemsArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetLaunchDateArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetLinkedFromArgs = {
  allowedLocales?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type PromoSheetPrimaryButtonPropsArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetPriorityArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetSecondaryButtonPropsArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetSheetHandleColorArgs = {
  locale?: InputMaybe<Scalars['String']>;
};


export type PromoSheetSubHeaderArgs = {
  locale?: InputMaybe<Scalars['String']>;
};

export type PromoSheetCollection = {
  __typename?: 'PromoSheetCollection';
  items: Array<Maybe<PromoSheet>>;
  limit: Scalars['Int'];
  skip: Scalars['Int'];
  total: Scalars['Int'];
};

export type PromoSheetFilter = {
  accentColor?: InputMaybe<Scalars['String']>;
  accentColor_contains?: InputMaybe<Scalars['String']>;
  accentColor_exists?: InputMaybe<Scalars['Boolean']>;
  accentColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  accentColor_not?: InputMaybe<Scalars['String']>;
  accentColor_not_contains?: InputMaybe<Scalars['String']>;
  accentColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  actions_exists?: InputMaybe<Scalars['Boolean']>;
  AND?: InputMaybe<Array<InputMaybe<PromoSheetFilter>>>;
  backgroundColor?: InputMaybe<Scalars['String']>;
  backgroundColor_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_exists?: InputMaybe<Scalars['Boolean']>;
  backgroundColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  backgroundColor_not?: InputMaybe<Scalars['String']>;
  backgroundColor_not_contains?: InputMaybe<Scalars['String']>;
  backgroundColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  backgroundImage_exists?: InputMaybe<Scalars['Boolean']>;
  campaignKey?: InputMaybe<Scalars['String']>;
  campaignKey_contains?: InputMaybe<Scalars['String']>;
  campaignKey_exists?: InputMaybe<Scalars['Boolean']>;
  campaignKey_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  campaignKey_not?: InputMaybe<Scalars['String']>;
  campaignKey_not_contains?: InputMaybe<Scalars['String']>;
  campaignKey_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contentfulMetadata?: InputMaybe<ContentfulMetadataFilter>;
  header_exists?: InputMaybe<Scalars['Boolean']>;
  headerImage_exists?: InputMaybe<Scalars['Boolean']>;
  headerImageAspectRatio?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_exists?: InputMaybe<Scalars['Boolean']>;
  headerImageAspectRatio_gt?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_gte?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_in?: InputMaybe<Array<InputMaybe<Scalars['Float']>>>;
  headerImageAspectRatio_lt?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_lte?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_not?: InputMaybe<Scalars['Float']>;
  headerImageAspectRatio_not_in?: InputMaybe<Array<InputMaybe<Scalars['Float']>>>;
  items_exists?: InputMaybe<Scalars['Boolean']>;
  launchDate?: InputMaybe<Scalars['DateTime']>;
  launchDate_exists?: InputMaybe<Scalars['Boolean']>;
  launchDate_gt?: InputMaybe<Scalars['DateTime']>;
  launchDate_gte?: InputMaybe<Scalars['DateTime']>;
  launchDate_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  launchDate_lt?: InputMaybe<Scalars['DateTime']>;
  launchDate_lte?: InputMaybe<Scalars['DateTime']>;
  launchDate_not?: InputMaybe<Scalars['DateTime']>;
  launchDate_not_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  OR?: InputMaybe<Array<InputMaybe<PromoSheetFilter>>>;
  primaryButtonProps_exists?: InputMaybe<Scalars['Boolean']>;
  priority?: InputMaybe<Scalars['Int']>;
  priority_exists?: InputMaybe<Scalars['Boolean']>;
  priority_gt?: InputMaybe<Scalars['Int']>;
  priority_gte?: InputMaybe<Scalars['Int']>;
  priority_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  priority_lt?: InputMaybe<Scalars['Int']>;
  priority_lte?: InputMaybe<Scalars['Int']>;
  priority_not?: InputMaybe<Scalars['Int']>;
  priority_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  secondaryButtonProps_exists?: InputMaybe<Scalars['Boolean']>;
  sheetHandleColor?: InputMaybe<Scalars['String']>;
  sheetHandleColor_contains?: InputMaybe<Scalars['String']>;
  sheetHandleColor_exists?: InputMaybe<Scalars['Boolean']>;
  sheetHandleColor_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  sheetHandleColor_not?: InputMaybe<Scalars['String']>;
  sheetHandleColor_not_contains?: InputMaybe<Scalars['String']>;
  sheetHandleColor_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  subHeader_exists?: InputMaybe<Scalars['Boolean']>;
  sys?: InputMaybe<SysFilter>;
};

export type PromoSheetLinkingCollections = {
  __typename?: 'PromoSheetLinkingCollections';
  entryCollection?: Maybe<EntryCollection>;
};


export type PromoSheetLinkingCollectionsEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export enum PromoSheetOrder {
  AccentColorAsc = 'accentColor_ASC',
  AccentColorDesc = 'accentColor_DESC',
  BackgroundColorAsc = 'backgroundColor_ASC',
  BackgroundColorDesc = 'backgroundColor_DESC',
  CampaignKeyAsc = 'campaignKey_ASC',
  CampaignKeyDesc = 'campaignKey_DESC',
  HeaderImageAspectRatioAsc = 'headerImageAspectRatio_ASC',
  HeaderImageAspectRatioDesc = 'headerImageAspectRatio_DESC',
  LaunchDateAsc = 'launchDate_ASC',
  LaunchDateDesc = 'launchDate_DESC',
  PriorityAsc = 'priority_ASC',
  PriorityDesc = 'priority_DESC',
  SheetHandleColorAsc = 'sheetHandleColor_ASC',
  SheetHandleColorDesc = 'sheetHandleColor_DESC',
  SysFirstPublishedAtAsc = 'sys_firstPublishedAt_ASC',
  SysFirstPublishedAtDesc = 'sys_firstPublishedAt_DESC',
  SysIdAsc = 'sys_id_ASC',
  SysIdDesc = 'sys_id_DESC',
  SysPublishedAtAsc = 'sys_publishedAt_ASC',
  SysPublishedAtDesc = 'sys_publishedAt_DESC',
  SysPublishedVersionAsc = 'sys_publishedVersion_ASC',
  SysPublishedVersionDesc = 'sys_publishedVersion_DESC'
}

export type Query = {
  __typename?: 'Query';
  asset?: Maybe<ContentfulAsset>;
  assetCollection?: Maybe<AssetCollection>;
  card?: Maybe<Card>;
  cardCollection?: Maybe<CardCollection>;
  claimPoapByQrHash?: Maybe<PoapClaimResult>;
  claimPoapBySecretWord?: Maybe<PoapClaimResult>;
  drop?: Maybe<Drop>;
  dropCollection?: Maybe<DropCollection>;
  entryCollection?: Maybe<EntryCollection>;
  faqEntry?: Maybe<FaqEntry>;
  faqEntryCollection?: Maybe<FaqEntryCollection>;
  getMintableCollection?: Maybe<MintableCollectionResult>;
  getMintableCollections?: Maybe<MintableCollectionsResult>;
  getPoapEventByQrHash?: Maybe<PoapEvent>;
  getPoapEventBySecretWord?: Maybe<PoapEvent>;
  getReservoirCollection?: Maybe<ReservoirCollectionResult>;
  nftOffers?: Maybe<Array<NftOffer>>;
  nfts?: Maybe<Array<SimpleHashNft>>;
  person?: Maybe<Person>;
  personCollection?: Maybe<PersonCollection>;
  pointsTweetIntent?: Maybe<PointsTweetIntent>;
  pointsTweetIntentCollection?: Maybe<PointsTweetIntentCollection>;
  post?: Maybe<Post>;
  postCollection?: Maybe<PostCollection>;
  promoSheet?: Maybe<PromoSheet>;
  promoSheetCollection?: Maybe<PromoSheetCollection>;
};


export type QueryAssetArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryAssetCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<AssetOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<AssetFilter>;
};


export type QueryCardArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryCardCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<CardOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<CardFilter>;
};


export type QueryClaimPoapByQrHashArgs = {
  qrHash: Scalars['String'];
  secret: Scalars['String'];
  walletAddress: Scalars['String'];
};


export type QueryClaimPoapBySecretWordArgs = {
  secretWord: Scalars['String'];
  walletAddress: Scalars['String'];
};


export type QueryDropArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryDropCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<DropOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<DropFilter>;
};


export type QueryEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<EntryOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<EntryFilter>;
};


export type QueryFaqEntryArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryFaqEntryCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<FaqEntryOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<FaqEntryFilter>;
};


export type QueryGetMintableCollectionArgs = {
  chain: Scalars['Int'];
  contractAddress: Scalars['String'];
  walletAddress: Scalars['String'];
};


export type QueryGetMintableCollectionsArgs = {
  walletAddress: Scalars['String'];
};


export type QueryGetPoapEventByQrHashArgs = {
  qrHash: Scalars['String'];
};


export type QueryGetPoapEventBySecretWordArgs = {
  secretWord: Scalars['String'];
};


export type QueryGetReservoirCollectionArgs = {
  chainId: Scalars['Int'];
  contractAddress: Scalars['String'];
};


export type QueryNftOffersArgs = {
  sortBy: SortCriterion;
  walletAddress: Scalars['String'];
};


export type QueryNftsArgs = {
  walletAddress: Scalars['String'];
};


export type QueryPersonArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryPersonCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<PersonOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PersonFilter>;
};


export type QueryPointsTweetIntentArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryPointsTweetIntentCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<PointsTweetIntentOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PointsTweetIntentFilter>;
};


export type QueryPostArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryPostCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<PostOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PostFilter>;
};


export type QueryPromoSheetArgs = {
  id: Scalars['String'];
  locale?: InputMaybe<Scalars['String']>;
  preview?: InputMaybe<Scalars['Boolean']>;
};


export type QueryPromoSheetCollectionArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  locale?: InputMaybe<Scalars['String']>;
  order?: InputMaybe<Array<InputMaybe<PromoSheetOrder>>>;
  preview?: InputMaybe<Scalars['Boolean']>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PromoSheetFilter>;
};

export type ReservoirCollection = {
  __typename?: 'ReservoirCollection';
  chainId: Scalars['Int'];
  createdAt?: Maybe<Scalars['String']>;
  creator?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  isMintingPublicSale?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  ownerCount?: Maybe<Scalars['Int']>;
  publicMintInfo?: Maybe<ReservoirMintStages>;
  sampleImages?: Maybe<Array<Maybe<Scalars['String']>>>;
  tokenCount?: Maybe<Scalars['String']>;
};

export type ReservoirCollectionResult = {
  __typename?: 'ReservoirCollectionResult';
  collection?: Maybe<ReservoirCollection>;
};

export type ReservoirCurrency = {
  __typename?: 'ReservoirCurrency';
  contract?: Maybe<Scalars['String']>;
  decimals?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  symbol?: Maybe<Scalars['String']>;
};

export type ReservoirMintStages = {
  __typename?: 'ReservoirMintStages';
  endTime?: Maybe<Scalars['String']>;
  kind?: Maybe<Scalars['String']>;
  maxMintsPerWallet?: Maybe<Scalars['String']>;
  price?: Maybe<ReservoirPrice>;
  stage?: Maybe<Scalars['String']>;
  startTime?: Maybe<Scalars['String']>;
};

export type ReservoirNumber = {
  __typename?: 'ReservoirNumber';
  decimal?: Maybe<Scalars['Float']>;
  native?: Maybe<Scalars['Float']>;
  raw?: Maybe<Scalars['String']>;
  usd?: Maybe<Scalars['Float']>;
};

export type ReservoirPrice = {
  __typename?: 'ReservoirPrice';
  amount?: Maybe<ReservoirNumber>;
  currency?: Maybe<ReservoirCurrency>;
  netAmount?: Maybe<ReservoirNumber>;
};

export type ResourceLink = {
  __typename?: 'ResourceLink';
  sys: ResourceSys;
};

export type ResourceSys = {
  __typename?: 'ResourceSys';
  linkType: Scalars['String'];
  type: Scalars['String'];
  urn: Scalars['String'];
};

export type Schema = {
  __typename?: 'schema';
  query?: Maybe<Query>;
};

export type SimpleHashAttributes = {
  __typename?: 'SimpleHashAttributes';
  display_type?: Maybe<Scalars['String']>;
  trait_type?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
};

export type SimpleHashAudioProperties = {
  __typename?: 'SimpleHashAudioProperties';
  audio_coding?: Maybe<Scalars['String']>;
  duration?: Maybe<Scalars['Float']>;
  mime_type?: Maybe<Scalars['String']>;
  size?: Maybe<Scalars['Float']>;
};

export type SimpleHashCollection = {
  __typename?: 'SimpleHashCollection';
  banner_image_url?: Maybe<Scalars['String']>;
  category?: Maybe<Scalars['String']>;
  chains?: Maybe<Array<Scalars['String']>>;
  collection_id?: Maybe<Scalars['String']>;
  collection_royalties?: Maybe<Array<SimpleHashRoyalty>>;
  description?: Maybe<Scalars['String']>;
  discord_url?: Maybe<Scalars['String']>;
  distinct_nft_count?: Maybe<Scalars['Float']>;
  distinct_owner_count?: Maybe<Scalars['Float']>;
  external_url?: Maybe<Scalars['String']>;
  floor_prices?: Maybe<Array<SimpleHashCollectionFloorPrice>>;
  image_url?: Maybe<Scalars['String']>;
  instagram_url?: Maybe<Scalars['String']>;
  is_nsfw?: Maybe<Scalars['Boolean']>;
  marketplace_pages?: Maybe<Array<SimpleHashCollectionMarketplacePage>>;
  medium_username?: Maybe<Scalars['String']>;
  metaplex_candy_machine?: Maybe<Scalars['String']>;
  metaplex_first_verified_creator?: Maybe<Scalars['String']>;
  metaplex_mint?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  spam_score?: Maybe<Scalars['Float']>;
  telegram_url?: Maybe<Scalars['String']>;
  top_bids?: Maybe<Array<SimpleHashCollectionTopBid>>;
  top_contracts?: Maybe<Array<Scalars['String']>>;
  total_quantity?: Maybe<Scalars['Float']>;
  twitter_username?: Maybe<Scalars['String']>;
};

export type SimpleHashCollectionFloorPrice = {
  __typename?: 'SimpleHashCollectionFloorPrice';
  marketplace_id?: Maybe<Scalars['String']>;
  payment_token?: Maybe<SimpleHashPaymentToken>;
  value?: Maybe<Scalars['Float']>;
  value_usd_cents?: Maybe<Scalars['Float']>;
};

export type SimpleHashCollectionMarketplacePage = {
  __typename?: 'SimpleHashCollectionMarketplacePage';
  collection_url?: Maybe<Scalars['String']>;
  marketplace_collection_id?: Maybe<Scalars['String']>;
  marketplace_id?: Maybe<Scalars['String']>;
  marketplace_name?: Maybe<Scalars['String']>;
  nft_url?: Maybe<Scalars['String']>;
  verified?: Maybe<Scalars['Boolean']>;
};

export type SimpleHashCollectionTopBid = {
  __typename?: 'SimpleHashCollectionTopBid';
  marketplace_id?: Maybe<Scalars['String']>;
  payment_token?: Maybe<SimpleHashPaymentToken>;
  value?: Maybe<Scalars['Float']>;
  value_usd_cents?: Maybe<Scalars['Float']>;
};

export type SimpleHashContract = {
  __typename?: 'SimpleHashContract';
  deployed_by?: Maybe<Scalars['String']>;
  deployed_via_contract?: Maybe<Scalars['String']>;
  has_multiple_collections?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  owned_by?: Maybe<Scalars['String']>;
  symbol?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type SimpleHashExtraMetadata = {
  __typename?: 'SimpleHashExtraMetadata';
  animation_original_url?: Maybe<Scalars['String']>;
  attributes?: Maybe<Array<SimpleHashAttributes>>;
  image_original_url?: Maybe<Scalars['String']>;
  metadata_original_url?: Maybe<Scalars['String']>;
};

export type SimpleHashFirstCreated = {
  __typename?: 'SimpleHashFirstCreated';
  block_number?: Maybe<Scalars['Float']>;
  minted_to?: Maybe<Scalars['String']>;
  quantity?: Maybe<Scalars['Float']>;
  quantity_string?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['String']>;
  transaction?: Maybe<Scalars['String']>;
  transaction_initiator?: Maybe<Scalars['String']>;
};

export type SimpleHashImageProperties = {
  __typename?: 'SimpleHashImageProperties';
  height?: Maybe<Scalars['Float']>;
  mime_type?: Maybe<Scalars['String']>;
  size?: Maybe<Scalars['Float']>;
  width?: Maybe<Scalars['Float']>;
};

export type SimpleHashLastSale = {
  __typename?: 'SimpleHashLastSale';
  from_address?: Maybe<Scalars['String']>;
  is_bundle_sale?: Maybe<Scalars['Boolean']>;
  marketplace_id?: Maybe<Scalars['String']>;
  marketplace_name?: Maybe<Scalars['String']>;
  payment_token?: Maybe<SimpleHashPaymentToken>;
  quantity?: Maybe<Scalars['Float']>;
  quantity_string?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['String']>;
  to_address?: Maybe<Scalars['String']>;
  total_price?: Maybe<Scalars['Float']>;
  transaction?: Maybe<Scalars['String']>;
  unit_price?: Maybe<Scalars['Float']>;
  unit_price_usd_cents?: Maybe<Scalars['Float']>;
};

export type SimpleHashModelProperties = {
  __typename?: 'SimpleHashModelProperties';
  mime_type?: Maybe<Scalars['String']>;
  size?: Maybe<Scalars['Float']>;
};

export type SimpleHashNft = {
  __typename?: 'SimpleHashNFT';
  audio_properties?: Maybe<SimpleHashAudioProperties>;
  audio_url?: Maybe<Scalars['String']>;
  background_color?: Maybe<Scalars['String']>;
  chain: Scalars['String'];
  collection: SimpleHashCollection;
  contract?: Maybe<SimpleHashContract>;
  contract_address: Scalars['String'];
  created_date?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  external_url?: Maybe<Scalars['String']>;
  extra_metadata?: Maybe<SimpleHashExtraMetadata>;
  first_created?: Maybe<SimpleHashFirstCreated>;
  image_properties?: Maybe<SimpleHashImageProperties>;
  image_url?: Maybe<Scalars['String']>;
  last_sale?: Maybe<SimpleHashLastSale>;
  model_properties?: Maybe<SimpleHashModelProperties>;
  model_url?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  nft_id?: Maybe<Scalars['String']>;
  owner_count?: Maybe<Scalars['Float']>;
  owners?: Maybe<Array<SimpleHashOwners>>;
  previews?: Maybe<SimpleHashPreviews>;
  rarity?: Maybe<SimpleHashRarity>;
  royalty?: Maybe<Array<SimpleHashRoyalty>>;
  status?: Maybe<Scalars['String']>;
  token_count?: Maybe<Scalars['Float']>;
  token_id: Scalars['String'];
  video_properties?: Maybe<SimpleHashVideoProperties>;
  video_url?: Maybe<Scalars['String']>;
};

export type SimpleHashOwners = {
  __typename?: 'SimpleHashOwners';
  first_acquired_date?: Maybe<Scalars['String']>;
  last_acquired_date?: Maybe<Scalars['String']>;
  owner_address?: Maybe<Scalars['String']>;
  quantity?: Maybe<Scalars['Float']>;
};

export type SimpleHashPaymentToken = {
  __typename?: 'SimpleHashPaymentToken';
  address?: Maybe<Scalars['String']>;
  decimals?: Maybe<Scalars['Float']>;
  name?: Maybe<Scalars['String']>;
  payment_token_id?: Maybe<Scalars['String']>;
  symbol?: Maybe<Scalars['String']>;
};

export type SimpleHashPreviews = {
  __typename?: 'SimpleHashPreviews';
  blurhash?: Maybe<Scalars['String']>;
  image_large_url?: Maybe<Scalars['String']>;
  image_medium_url?: Maybe<Scalars['String']>;
  image_opengraph_url?: Maybe<Scalars['String']>;
  image_small_url?: Maybe<Scalars['String']>;
  predominant_color?: Maybe<Scalars['String']>;
};

export type SimpleHashRarity = {
  __typename?: 'SimpleHashRarity';
  rank?: Maybe<Scalars['Float']>;
  score?: Maybe<Scalars['Float']>;
  unique_attributes?: Maybe<Scalars['Float']>;
};

export type SimpleHashRoyalty = {
  __typename?: 'SimpleHashRoyalty';
  recipients?: Maybe<Array<SimpleHashRoyaltyRecipient>>;
  source?: Maybe<Scalars['String']>;
  total_creator_fee_basis_points?: Maybe<Scalars['Float']>;
};

export type SimpleHashRoyaltyRecipient = {
  __typename?: 'SimpleHashRoyaltyRecipient';
  address?: Maybe<Scalars['String']>;
  basis_points?: Maybe<Scalars['Float']>;
  percentage?: Maybe<Scalars['Float']>;
};

export type SimpleHashVideoProperties = {
  __typename?: 'SimpleHashVideoProperties';
  audio_coding?: Maybe<Scalars['String']>;
  duration?: Maybe<Scalars['Float']>;
  height?: Maybe<Scalars['Float']>;
  mime_type?: Maybe<Scalars['String']>;
  size?: Maybe<Scalars['Float']>;
  video_coding?: Maybe<Scalars['String']>;
  width?: Maybe<Scalars['Float']>;
};

export enum SortCriterion {
  DateCreated = 'DATE_CREATED',
  FloorDifferencePercentage = 'FLOOR_DIFFERENCE_PERCENTAGE',
  TopBidValue = 'TOP_BID_VALUE'
}

export type Sys = {
  __typename?: 'Sys';
  environmentId: Scalars['String'];
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['String'];
  publishedAt?: Maybe<Scalars['DateTime']>;
  publishedVersion?: Maybe<Scalars['Int']>;
  spaceId: Scalars['String'];
};

export type SysFilter = {
  firstPublishedAt?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_exists?: InputMaybe<Scalars['Boolean']>;
  firstPublishedAt_gt?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_gte?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  firstPublishedAt_lt?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_lte?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_not?: InputMaybe<Scalars['DateTime']>;
  firstPublishedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  id?: InputMaybe<Scalars['String']>;
  id_contains?: InputMaybe<Scalars['String']>;
  id_exists?: InputMaybe<Scalars['Boolean']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  id_not?: InputMaybe<Scalars['String']>;
  id_not_contains?: InputMaybe<Scalars['String']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  publishedAt?: InputMaybe<Scalars['DateTime']>;
  publishedAt_exists?: InputMaybe<Scalars['Boolean']>;
  publishedAt_gt?: InputMaybe<Scalars['DateTime']>;
  publishedAt_gte?: InputMaybe<Scalars['DateTime']>;
  publishedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  publishedAt_lt?: InputMaybe<Scalars['DateTime']>;
  publishedAt_lte?: InputMaybe<Scalars['DateTime']>;
  publishedAt_not?: InputMaybe<Scalars['DateTime']>;
  publishedAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>;
  publishedVersion?: InputMaybe<Scalars['Float']>;
  publishedVersion_exists?: InputMaybe<Scalars['Boolean']>;
  publishedVersion_gt?: InputMaybe<Scalars['Float']>;
  publishedVersion_gte?: InputMaybe<Scalars['Float']>;
  publishedVersion_in?: InputMaybe<Array<InputMaybe<Scalars['Float']>>>;
  publishedVersion_lt?: InputMaybe<Scalars['Float']>;
  publishedVersion_lte?: InputMaybe<Scalars['Float']>;
  publishedVersion_not?: InputMaybe<Scalars['Float']>;
  publishedVersion_not_in?: InputMaybe<Array<InputMaybe<Scalars['Float']>>>;
};

export type AssetFragment = { __typename?: 'Asset', address: string, symbol: string, decimals: number, name: string };

export type AmountFragment = { __typename?: 'AssetAmount', raw: string, decimal: number, usd: number };

export type GetNftOffersQueryVariables = Exact<{
  walletAddress: Scalars['String'];
  sortBy: SortCriterion;
}>;


export type GetNftOffersQuery = { __typename?: 'Query', nftOffers?: Array<{ __typename?: 'NFTOffer', createdAt: number, url: string, floorDifferencePercentage: number, validUntil: number, royaltiesPercentage: number, feesPercentage: number, network: string, nft: { __typename?: 'PartialNFT', aspectRatio?: number | null, name: string, contractAddress: string, tokenId: string, collectionName: string, imageUrl: string, uniqueId: string, predominantColor?: string | null }, marketplace: { __typename?: 'NFTMarketplace', name: string, imageUrl: string }, grossAmount: { __typename?: 'AssetAmount', raw: string, decimal: number, usd: number }, netAmount: { __typename?: 'AssetAmount', raw: string, decimal: number, usd: number }, paymentToken: { __typename?: 'Asset', address: string, symbol: string, decimals: number, name: string }, floorPrice: { __typename?: 'NFTFloorPrice', amount: { __typename?: 'AssetAmount', raw: string, decimal: number, usd: number }, paymentToken: { __typename?: 'Asset', address: string, symbol: string, decimals: number, name: string } } }> | null };

export type GetPoapEventByQrHashQueryVariables = Exact<{
  qrHash: Scalars['String'];
}>;


export type GetPoapEventByQrHashQuery = { __typename?: 'Query', getPoapEventByQrHash?: { __typename?: 'PoapEvent', id: number, name: string, imageUrl: string, createdAt: string, qrHash?: string | null, secret?: string | null } | null };

export type ClaimPoapByQrHashQueryVariables = Exact<{
  walletAddress: Scalars['String'];
  qrHash: Scalars['String'];
  secret: Scalars['String'];
}>;


export type ClaimPoapByQrHashQuery = { __typename?: 'Query', claimPoapByQrHash?: { __typename?: 'PoapClaimResult', success: boolean, error?: string | null } | null };

export type GetPoapEventBySecretWordQueryVariables = Exact<{
  secretWord: Scalars['String'];
}>;


export type GetPoapEventBySecretWordQuery = { __typename?: 'Query', getPoapEventBySecretWord?: { __typename?: 'PoapEvent', id: number, name: string, imageUrl: string, createdAt: string, qrHash?: string | null, secretWord?: string | null } | null };

export type ClaimPoapBySecretWordQueryVariables = Exact<{
  walletAddress: Scalars['String'];
  secretWord: Scalars['String'];
}>;


export type ClaimPoapBySecretWordQuery = { __typename?: 'Query', claimPoapBySecretWord?: { __typename?: 'PoapClaimResult', success: boolean, error?: string | null } | null };

export type GetReservoirCollectionQueryVariables = Exact<{
  contractAddress: Scalars['String'];
  chainId: Scalars['Int'];
}>;


export type GetReservoirCollectionQuery = { __typename?: 'Query', getReservoirCollection?: { __typename?: 'ReservoirCollectionResult', collection?: { __typename?: 'ReservoirCollection', id?: string | null, chainId: number, createdAt?: string | null, name?: string | null, image?: string | null, description?: string | null, sampleImages?: Array<string | null> | null, tokenCount?: string | null, creator?: string | null, ownerCount?: number | null, isMintingPublicSale?: boolean | null, publicMintInfo?: { __typename?: 'ReservoirMintStages', stage?: string | null, kind?: string | null, startTime?: string | null, endTime?: string | null, maxMintsPerWallet?: string | null, price?: { __typename?: 'ReservoirPrice', currency?: { __typename?: 'ReservoirCurrency', contract?: string | null, name?: string | null, symbol?: string | null, decimals?: number | null } | null, amount?: { __typename?: 'ReservoirNumber', raw?: string | null, decimal?: number | null, usd?: number | null, native?: number | null } | null, netAmount?: { __typename?: 'ReservoirNumber', raw?: string | null, decimal?: number | null, usd?: number | null, native?: number | null } | null } | null } | null } | null } | null };

export type MintStatusFragment = { __typename?: 'MintStatus', isMintable: boolean, price: string };

export type MintedNftFragment = { __typename?: 'MintedNFT', tokenID: string, imageURI?: string | null, mimeType?: string | null, title?: string | null, value?: string | null, mintTime?: string | null };

export type MintableCollectionFragment = { __typename?: 'MintableCollection', externalURL: string, contract: string, contractAddress: string, chainId: number, deployer?: string | null, name: string, imageURL?: string | null, imageMimeType?: string | null, mintsLastHour: number, addressesLastHour?: number | null, lastEvent?: string | null, firstEvent: string, totalMints: number, maxSupply?: string | null, recentMints: Array<{ __typename?: 'MintedNFT', tokenID: string, imageURI?: string | null, mimeType?: string | null, title?: string | null, value?: string | null, mintTime?: string | null }>, mintStatus: { __typename?: 'MintStatus', isMintable: boolean, price: string } };

export type MintableCollectionsResultFragment = { __typename?: 'MintableCollectionsResult', collections: Array<{ __typename?: 'MintableCollection', externalURL: string, contract: string, contractAddress: string, chainId: number, deployer?: string | null, name: string, imageURL?: string | null, imageMimeType?: string | null, mintsLastHour: number, addressesLastHour?: number | null, lastEvent?: string | null, firstEvent: string, totalMints: number, maxSupply?: string | null, recentMints: Array<{ __typename?: 'MintedNFT', tokenID: string, imageURI?: string | null, mimeType?: string | null, title?: string | null, value?: string | null, mintTime?: string | null }>, mintStatus: { __typename?: 'MintStatus', isMintable: boolean, price: string } }> };

export type MintableCollectionResultFragment = { __typename?: 'MintableCollectionResult', collection: { __typename?: 'MintableCollection', externalURL: string, contract: string, contractAddress: string, chainId: number, deployer?: string | null, name: string, imageURL?: string | null, imageMimeType?: string | null, mintsLastHour: number, addressesLastHour?: number | null, lastEvent?: string | null, firstEvent: string, totalMints: number, maxSupply?: string | null, recentMints: Array<{ __typename?: 'MintedNFT', tokenID: string, imageURI?: string | null, mimeType?: string | null, title?: string | null, value?: string | null, mintTime?: string | null }>, mintStatus: { __typename?: 'MintStatus', isMintable: boolean, price: string } } };

export type GetMintableCollectionsQueryVariables = Exact<{
  walletAddress: Scalars['String'];
}>;


export type GetMintableCollectionsQuery = { __typename?: 'Query', getMintableCollections?: { __typename?: 'MintableCollectionsResult', collections: Array<{ __typename?: 'MintableCollection', externalURL: string, contract: string, contractAddress: string, chainId: number, deployer?: string | null, name: string, imageURL?: string | null, imageMimeType?: string | null, mintsLastHour: number, addressesLastHour?: number | null, lastEvent?: string | null, firstEvent: string, totalMints: number, maxSupply?: string | null, recentMints: Array<{ __typename?: 'MintedNFT', tokenID: string, imageURI?: string | null, mimeType?: string | null, title?: string | null, value?: string | null, mintTime?: string | null }>, mintStatus: { __typename?: 'MintStatus', isMintable: boolean, price: string } }> } | null };

export type GetPromoSheetCollectionQueryVariables = Exact<{
  order?: InputMaybe<Array<InputMaybe<PromoSheetOrder>> | InputMaybe<PromoSheetOrder>>;
}>;


export type GetPromoSheetCollectionQuery = { __typename?: 'Query', promoSheetCollection?: { __typename?: 'PromoSheetCollection', items: Array<{ __typename?: 'PromoSheet', campaignKey?: string | null, launchDate?: any | null, actions?: any | null, priority?: number | null, sys: { __typename?: 'Sys', id: string } } | null> } | null };

export type GetPromoSheetQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetPromoSheetQuery = { __typename?: 'Query', promoSheet?: { __typename?: 'PromoSheet', accentColor?: string | null, actions?: any | null, backgroundColor?: string | null, header?: any | null, headerImageAspectRatio?: number | null, items?: any | null, primaryButtonProps?: any | null, secondaryButtonProps?: any | null, sheetHandleColor?: string | null, subHeader?: any | null, backgroundImage?: { __typename?: 'ContentfulAsset', url?: string | null } | null, headerImage?: { __typename?: 'ContentfulAsset', url?: string | null } | null } | null };

export type CardFragment = { __typename?: 'Card', cardKey?: string | null, dismissable?: boolean | null, placement?: string | null, index?: number | null, backgroundColor?: string | null, accentColor?: string | null, padding?: number | null, borderRadius?: number | null, imageIcon?: string | null, imageRadius?: number | null, title?: any | null, titleColor?: string | null, subtitle?: any | null, subtitleColor?: string | null, primaryButton?: any | null, sys: { __typename?: 'Sys', id: string }, imageCollection?: { __typename?: 'AssetCollection', items: Array<{ __typename?: 'ContentfulAsset', url?: string | null } | null> } | null };

export type GetCardQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetCardQuery = { __typename?: 'Query', card?: { __typename?: 'Card', cardKey?: string | null, dismissable?: boolean | null, placement?: string | null, index?: number | null, backgroundColor?: string | null, accentColor?: string | null, padding?: number | null, borderRadius?: number | null, imageIcon?: string | null, imageRadius?: number | null, title?: any | null, titleColor?: string | null, subtitle?: any | null, subtitleColor?: string | null, primaryButton?: any | null, sys: { __typename?: 'Sys', id: string }, imageCollection?: { __typename?: 'AssetCollection', items: Array<{ __typename?: 'ContentfulAsset', url?: string | null } | null> } | null } | null };

export type GetCardCollectionQueryVariables = Exact<{
  order?: InputMaybe<Array<InputMaybe<CardOrder>> | InputMaybe<CardOrder>>;
  where?: InputMaybe<CardFilter>;
}>;


export type GetCardCollectionQuery = { __typename?: 'Query', cardCollection?: { __typename?: 'CardCollection', items: Array<{ __typename?: 'Card', cardKey?: string | null, dismissable?: boolean | null, placement?: string | null, index?: number | null, backgroundColor?: string | null, accentColor?: string | null, padding?: number | null, borderRadius?: number | null, imageIcon?: string | null, imageRadius?: number | null, title?: any | null, titleColor?: string | null, subtitle?: any | null, subtitleColor?: string | null, primaryButton?: any | null, sys: { __typename?: 'Sys', id: string }, imageCollection?: { __typename?: 'AssetCollection', items: Array<{ __typename?: 'ContentfulAsset', url?: string | null } | null> } | null } | null> } | null };

export type GetPointsTweetIntentCollectionQueryVariables = Exact<{
  order?: InputMaybe<Array<InputMaybe<PointsTweetIntentOrder>> | InputMaybe<PointsTweetIntentOrder>>;
}>;


export type GetPointsTweetIntentCollectionQuery = { __typename?: 'Query', pointsTweetIntentCollection?: { __typename?: 'PointsTweetIntentCollection', items: Array<{ __typename?: 'PointsTweetIntent', key?: string | null, text?: string | null, via?: string | null, url?: string | null, sys: { __typename?: 'Sys', id: string } } | null> } | null };

export type GetPointsTweetIntentQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetPointsTweetIntentQuery = { __typename?: 'Query', pointsTweetIntent?: { __typename?: 'PointsTweetIntent', key?: string | null, text?: string | null, via?: string | null, url?: string | null } | null };

export type SimpleHashPaymentTokenFragment = { __typename?: 'SimpleHashPaymentToken', payment_token_id?: string | null, name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null };

export type GetNfTsQueryVariables = Exact<{
  walletAddress: Scalars['String'];
}>;


export type GetNfTsQuery = { __typename?: 'Query', nfts?: Array<{ __typename?: 'SimpleHashNFT', nft_id?: string | null, chain: string, contract_address: string, token_id: string, name: string, description?: string | null, image_url?: string | null, video_url?: string | null, audio_url?: string | null, model_url?: string | null, background_color?: string | null, external_url?: string | null, created_date?: string | null, status?: string | null, token_count?: number | null, owner_count?: number | null, previews?: { __typename?: 'SimpleHashPreviews', image_small_url?: string | null, image_medium_url?: string | null, image_large_url?: string | null, image_opengraph_url?: string | null, blurhash?: string | null, predominant_color?: string | null } | null, image_properties?: { __typename?: 'SimpleHashImageProperties', width?: number | null, height?: number | null, size?: number | null, mime_type?: string | null } | null, video_properties?: { __typename?: 'SimpleHashVideoProperties', width?: number | null, height?: number | null, duration?: number | null, video_coding?: string | null, audio_coding?: string | null, size?: number | null, mime_type?: string | null } | null, audio_properties?: { __typename?: 'SimpleHashAudioProperties', duration?: number | null, audio_coding?: string | null, size?: number | null, mime_type?: string | null } | null, model_properties?: { __typename?: 'SimpleHashModelProperties', size?: number | null, mime_type?: string | null } | null, owners?: Array<{ __typename?: 'SimpleHashOwners', owner_address?: string | null, quantity?: number | null, first_acquired_date?: string | null, last_acquired_date?: string | null }> | null, last_sale?: { __typename?: 'SimpleHashLastSale', from_address?: string | null, to_address?: string | null, quantity?: number | null, quantity_string?: string | null, timestamp?: string | null, transaction?: string | null, marketplace_id?: string | null, marketplace_name?: string | null, is_bundle_sale?: boolean | null, unit_price?: number | null, total_price?: number | null, unit_price_usd_cents?: number | null, payment_token?: { __typename?: 'SimpleHashPaymentToken', payment_token_id?: string | null, name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null } | null } | null, first_created?: { __typename?: 'SimpleHashFirstCreated', minted_to?: string | null, quantity?: number | null, quantity_string?: string | null, timestamp?: string | null, block_number?: number | null, transaction?: string | null, transaction_initiator?: string | null } | null, contract?: { __typename?: 'SimpleHashContract', type?: string | null, name?: string | null, symbol?: string | null, deployed_by?: string | null, deployed_via_contract?: string | null, owned_by?: string | null, has_multiple_collections?: boolean | null } | null, collection: { __typename?: 'SimpleHashCollection', collection_id?: string | null, name: string, description?: string | null, image_url?: string | null, banner_image_url?: string | null, category?: string | null, is_nsfw?: boolean | null, external_url?: string | null, twitter_username?: string | null, discord_url?: string | null, instagram_url?: string | null, medium_username?: string | null, telegram_url?: string | null, metaplex_mint?: string | null, metaplex_candy_machine?: string | null, metaplex_first_verified_creator?: string | null, spam_score?: number | null, distinct_owner_count?: number | null, distinct_nft_count?: number | null, total_quantity?: number | null, chains?: Array<string> | null, top_contracts?: Array<string> | null, marketplace_pages?: Array<{ __typename?: 'SimpleHashCollectionMarketplacePage', marketplace_id?: string | null, marketplace_name?: string | null, marketplace_collection_id?: string | null, nft_url?: string | null, collection_url?: string | null, verified?: boolean | null }> | null, floor_prices?: Array<{ __typename?: 'SimpleHashCollectionFloorPrice', marketplace_id?: string | null, value?: number | null, value_usd_cents?: number | null, payment_token?: { __typename?: 'SimpleHashPaymentToken', payment_token_id?: string | null, name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null } | null }> | null, top_bids?: Array<{ __typename?: 'SimpleHashCollectionTopBid', marketplace_id?: string | null, value?: number | null, value_usd_cents?: number | null, payment_token?: { __typename?: 'SimpleHashPaymentToken', payment_token_id?: string | null, name?: string | null, symbol?: string | null, address?: string | null, decimals?: number | null } | null }> | null, collection_royalties?: Array<{ __typename?: 'SimpleHashRoyalty', source?: string | null, total_creator_fee_basis_points?: number | null, recipients?: Array<{ __typename?: 'SimpleHashRoyaltyRecipient', address?: string | null, percentage?: number | null, basis_points?: number | null }> | null }> | null }, rarity?: { __typename?: 'SimpleHashRarity', rank?: number | null, score?: number | null, unique_attributes?: number | null } | null, royalty?: Array<{ __typename?: 'SimpleHashRoyalty', source?: string | null, total_creator_fee_basis_points?: number | null, recipients?: Array<{ __typename?: 'SimpleHashRoyaltyRecipient', address?: string | null, percentage?: number | null, basis_points?: number | null }> | null }> | null, extra_metadata?: { __typename?: 'SimpleHashExtraMetadata', image_original_url?: string | null, animation_original_url?: string | null, metadata_original_url?: string | null, attributes?: Array<{ __typename?: 'SimpleHashAttributes', trait_type?: string | null, value?: string | null, display_type?: string | null }> | null } | null }> | null };

export const AssetFragmentDoc = gql`
    fragment asset on Asset {
  address
  symbol
  decimals
  name
}
    `;
export const AmountFragmentDoc = gql`
    fragment amount on AssetAmount {
  raw
  decimal
  usd
}
    `;
export const MintedNftFragmentDoc = gql`
    fragment mintedNFT on MintedNFT {
  tokenID
  imageURI
  mimeType
  title
  value
  mintTime
}
    `;
export const MintStatusFragmentDoc = gql`
    fragment mintStatus on MintStatus {
  isMintable
  price
}
    `;
export const MintableCollectionFragmentDoc = gql`
    fragment mintableCollection on MintableCollection {
  externalURL
  contract
  contractAddress
  chainId
  deployer
  name
  imageURL
  imageMimeType
  mintsLastHour
  addressesLastHour
  lastEvent
  firstEvent
  totalMints
  maxSupply
  recentMints {
    ...mintedNFT
  }
  mintStatus {
    ...mintStatus
  }
}
    ${MintedNftFragmentDoc}
${MintStatusFragmentDoc}`;
export const MintableCollectionsResultFragmentDoc = gql`
    fragment mintableCollectionsResult on MintableCollectionsResult {
  collections {
    ...mintableCollection
  }
}
    ${MintableCollectionFragmentDoc}`;
export const MintableCollectionResultFragmentDoc = gql`
    fragment mintableCollectionResult on MintableCollectionResult {
  collection {
    ...mintableCollection
  }
}
    ${MintableCollectionFragmentDoc}`;
export const CardFragmentDoc = gql`
    fragment card on Card {
  sys {
    id
  }
  cardKey
  dismissable
  placement
  index
  backgroundColor
  accentColor
  padding
  borderRadius
  imageIcon
  imageCollection {
    items {
      url
    }
  }
  imageRadius
  title
  titleColor
  subtitle
  subtitleColor
  primaryButton
}
    `;
export const SimpleHashPaymentTokenFragmentDoc = gql`
    fragment simpleHashPaymentToken on SimpleHashPaymentToken {
  payment_token_id
  name
  symbol
  address
  decimals
}
    `;
export const GetNftOffersDocument = gql`
    query getNFTOffers($walletAddress: String!, $sortBy: SortCriterion!) {
  nftOffers(walletAddress: $walletAddress, sortBy: $sortBy) {
    createdAt
    url
    nft {
      aspectRatio
      name
      contractAddress
      tokenId
      collectionName
      imageUrl
      uniqueId
      predominantColor
    }
    floorDifferencePercentage
    validUntil
    marketplace {
      name
      imageUrl
    }
    grossAmount {
      ...amount
    }
    netAmount {
      ...amount
    }
    paymentToken {
      ...asset
    }
    royaltiesPercentage
    feesPercentage
    floorPrice {
      amount {
        ...amount
      }
      paymentToken {
        ...asset
      }
    }
    network
  }
}
    ${AmountFragmentDoc}
${AssetFragmentDoc}`;
export const GetPoapEventByQrHashDocument = gql`
    query getPoapEventByQrHash($qrHash: String!) {
  getPoapEventByQrHash(qrHash: $qrHash) {
    id
    name
    imageUrl
    createdAt
    qrHash
    secret
  }
}
    `;
export const ClaimPoapByQrHashDocument = gql`
    query claimPoapByQrHash($walletAddress: String!, $qrHash: String!, $secret: String!) {
  claimPoapByQrHash(walletAddress: $walletAddress, qrHash: $qrHash, secret: $secret) {
    success
    error
  }
}
    `;
export const GetPoapEventBySecretWordDocument = gql`
    query getPoapEventBySecretWord($secretWord: String!) {
  getPoapEventBySecretWord(secretWord: $secretWord) {
    id
    name
    imageUrl
    createdAt
    qrHash
    secretWord
  }
}
    `;
export const ClaimPoapBySecretWordDocument = gql`
    query claimPoapBySecretWord($walletAddress: String!, $secretWord: String!) {
  claimPoapBySecretWord(walletAddress: $walletAddress, secretWord: $secretWord) {
    success
    error
  }
}
    `;
export const GetReservoirCollectionDocument = gql`
    query getReservoirCollection($contractAddress: String!, $chainId: Int!) {
  getReservoirCollection(contractAddress: $contractAddress, chainId: $chainId) {
    collection {
      id
      chainId
      createdAt
      name
      image
      description
      sampleImages
      tokenCount
      creator
      ownerCount
      isMintingPublicSale
      publicMintInfo {
        stage
        kind
        price {
          currency {
            contract
            name
            symbol
            decimals
          }
          amount {
            raw
            decimal
            usd
            native
          }
          netAmount {
            raw
            decimal
            usd
            native
          }
        }
        startTime
        endTime
        maxMintsPerWallet
      }
    }
  }
}
    `;
export const GetMintableCollectionsDocument = gql`
    query getMintableCollections($walletAddress: String!) {
  getMintableCollections(walletAddress: $walletAddress) {
    collections {
      ...mintableCollection
    }
  }
}
    ${MintableCollectionFragmentDoc}`;
export const GetPromoSheetCollectionDocument = gql`
    query getPromoSheetCollection($order: [PromoSheetOrder]) {
  promoSheetCollection(order: $order) {
    items {
      sys {
        id
      }
      campaignKey
      launchDate
      actions
      priority
    }
  }
}
    `;
export const GetPromoSheetDocument = gql`
    query getPromoSheet($id: String!) {
  promoSheet(id: $id) {
    accentColor
    actions
    backgroundColor
    backgroundImage {
      url
    }
    header
    headerImage {
      url
    }
    headerImageAspectRatio
    items
    primaryButtonProps
    secondaryButtonProps
    sheetHandleColor
    subHeader
  }
}
    `;
export const GetCardDocument = gql`
    query getCard($id: String!) {
  card(id: $id) {
    ...card
  }
}
    ${CardFragmentDoc}`;
export const GetCardCollectionDocument = gql`
    query getCardCollection($order: [CardOrder], $where: CardFilter) {
  cardCollection(order: $order, where: $where) {
    items {
      ...card
    }
  }
}
    ${CardFragmentDoc}`;
export const GetPointsTweetIntentCollectionDocument = gql`
    query getPointsTweetIntentCollection($order: [PointsTweetIntentOrder]) {
  pointsTweetIntentCollection(order: $order) {
    items {
      sys {
        id
      }
      key
      text
      via
      url
    }
  }
}
    `;
export const GetPointsTweetIntentDocument = gql`
    query getPointsTweetIntent($id: String!) {
  pointsTweetIntent(id: $id) {
    key
    text
    via
    url
  }
}
    `;
export const GetNfTsDocument = gql`
    query getNFTs($walletAddress: String!) {
  nfts(walletAddress: $walletAddress) {
    nft_id
    chain
    contract_address
    token_id
    name
    description
    previews {
      image_small_url
      image_medium_url
      image_large_url
      image_opengraph_url
      blurhash
      predominant_color
    }
    image_url
    image_properties {
      width
      height
      size
      mime_type
    }
    video_url
    video_properties {
      width
      height
      duration
      video_coding
      audio_coding
      size
      mime_type
    }
    audio_url
    audio_properties {
      duration
      audio_coding
      size
      mime_type
    }
    model_url
    model_properties {
      size
      mime_type
    }
    background_color
    external_url
    created_date
    status
    token_count
    owner_count
    owners {
      owner_address
      quantity
      first_acquired_date
      last_acquired_date
    }
    last_sale {
      from_address
      to_address
      quantity
      quantity_string
      timestamp
      transaction
      marketplace_id
      marketplace_name
      is_bundle_sale
      payment_token {
        ...simpleHashPaymentToken
      }
      unit_price
      total_price
      unit_price_usd_cents
    }
    first_created {
      minted_to
      quantity
      quantity_string
      timestamp
      block_number
      transaction
      transaction_initiator
    }
    contract {
      type
      name
      symbol
      deployed_by
      deployed_via_contract
      owned_by
      has_multiple_collections
    }
    collection {
      collection_id
      name
      description
      image_url
      banner_image_url
      category
      is_nsfw
      external_url
      twitter_username
      discord_url
      instagram_url
      medium_username
      telegram_url
      marketplace_pages {
        marketplace_id
        marketplace_name
        marketplace_collection_id
        nft_url
        collection_url
        verified
      }
      metaplex_mint
      metaplex_candy_machine
      metaplex_first_verified_creator
      spam_score
      floor_prices {
        marketplace_id
        value
        payment_token {
          ...simpleHashPaymentToken
        }
        value_usd_cents
      }
      top_bids {
        marketplace_id
        value
        payment_token {
          ...simpleHashPaymentToken
        }
        value_usd_cents
      }
      distinct_owner_count
      distinct_nft_count
      total_quantity
      chains
      top_contracts
      collection_royalties {
        source
        total_creator_fee_basis_points
        recipients {
          address
          percentage
          basis_points
        }
      }
    }
    rarity {
      rank
      score
      unique_attributes
    }
    royalty {
      source
      total_creator_fee_basis_points
      recipients {
        address
        percentage
        basis_points
      }
    }
    extra_metadata {
      image_original_url
      animation_original_url
      metadata_original_url
      attributes {
        trait_type
        value
        display_type
      }
    }
  }
}
    ${SimpleHashPaymentTokenFragmentDoc}`;
export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    getNFTOffers(variables: GetNftOffersQueryVariables, options?: C): Promise<GetNftOffersQuery> {
      return requester<GetNftOffersQuery, GetNftOffersQueryVariables>(GetNftOffersDocument, variables, options) as Promise<GetNftOffersQuery>;
    },
    getPoapEventByQrHash(variables: GetPoapEventByQrHashQueryVariables, options?: C): Promise<GetPoapEventByQrHashQuery> {
      return requester<GetPoapEventByQrHashQuery, GetPoapEventByQrHashQueryVariables>(GetPoapEventByQrHashDocument, variables, options) as Promise<GetPoapEventByQrHashQuery>;
    },
    claimPoapByQrHash(variables: ClaimPoapByQrHashQueryVariables, options?: C): Promise<ClaimPoapByQrHashQuery> {
      return requester<ClaimPoapByQrHashQuery, ClaimPoapByQrHashQueryVariables>(ClaimPoapByQrHashDocument, variables, options) as Promise<ClaimPoapByQrHashQuery>;
    },
    getPoapEventBySecretWord(variables: GetPoapEventBySecretWordQueryVariables, options?: C): Promise<GetPoapEventBySecretWordQuery> {
      return requester<GetPoapEventBySecretWordQuery, GetPoapEventBySecretWordQueryVariables>(GetPoapEventBySecretWordDocument, variables, options) as Promise<GetPoapEventBySecretWordQuery>;
    },
    claimPoapBySecretWord(variables: ClaimPoapBySecretWordQueryVariables, options?: C): Promise<ClaimPoapBySecretWordQuery> {
      return requester<ClaimPoapBySecretWordQuery, ClaimPoapBySecretWordQueryVariables>(ClaimPoapBySecretWordDocument, variables, options) as Promise<ClaimPoapBySecretWordQuery>;
    },
    getReservoirCollection(variables: GetReservoirCollectionQueryVariables, options?: C): Promise<GetReservoirCollectionQuery> {
      return requester<GetReservoirCollectionQuery, GetReservoirCollectionQueryVariables>(GetReservoirCollectionDocument, variables, options) as Promise<GetReservoirCollectionQuery>;
    },
    getMintableCollections(variables: GetMintableCollectionsQueryVariables, options?: C): Promise<GetMintableCollectionsQuery> {
      return requester<GetMintableCollectionsQuery, GetMintableCollectionsQueryVariables>(GetMintableCollectionsDocument, variables, options) as Promise<GetMintableCollectionsQuery>;
    },
    getPromoSheetCollection(variables?: GetPromoSheetCollectionQueryVariables, options?: C): Promise<GetPromoSheetCollectionQuery> {
      return requester<GetPromoSheetCollectionQuery, GetPromoSheetCollectionQueryVariables>(GetPromoSheetCollectionDocument, variables, options) as Promise<GetPromoSheetCollectionQuery>;
    },
    getPromoSheet(variables: GetPromoSheetQueryVariables, options?: C): Promise<GetPromoSheetQuery> {
      return requester<GetPromoSheetQuery, GetPromoSheetQueryVariables>(GetPromoSheetDocument, variables, options) as Promise<GetPromoSheetQuery>;
    },
    getCard(variables: GetCardQueryVariables, options?: C): Promise<GetCardQuery> {
      return requester<GetCardQuery, GetCardQueryVariables>(GetCardDocument, variables, options) as Promise<GetCardQuery>;
    },
    getCardCollection(variables?: GetCardCollectionQueryVariables, options?: C): Promise<GetCardCollectionQuery> {
      return requester<GetCardCollectionQuery, GetCardCollectionQueryVariables>(GetCardCollectionDocument, variables, options) as Promise<GetCardCollectionQuery>;
    },
    getPointsTweetIntentCollection(variables?: GetPointsTweetIntentCollectionQueryVariables, options?: C): Promise<GetPointsTweetIntentCollectionQuery> {
      return requester<GetPointsTweetIntentCollectionQuery, GetPointsTweetIntentCollectionQueryVariables>(GetPointsTweetIntentCollectionDocument, variables, options) as Promise<GetPointsTweetIntentCollectionQuery>;
    },
    getPointsTweetIntent(variables: GetPointsTweetIntentQueryVariables, options?: C): Promise<GetPointsTweetIntentQuery> {
      return requester<GetPointsTweetIntentQuery, GetPointsTweetIntentQueryVariables>(GetPointsTweetIntentDocument, variables, options) as Promise<GetPointsTweetIntentQuery>;
    },
    getNFTs(variables: GetNfTsQueryVariables, options?: C): Promise<GetNfTsQuery> {
      return requester<GetNfTsQuery, GetNfTsQueryVariables>(GetNfTsDocument, variables, options) as Promise<GetNfTsQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;