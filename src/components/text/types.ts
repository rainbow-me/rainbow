import { fonts } from '@/styles';

export type TextSize = number | keyof typeof fonts.size;
export type TextLineHeight = number | keyof typeof fonts.lineHeight;
export type TextLetterSpacing = number | keyof typeof fonts.letterSpacing;
export type TextWeight = number | keyof typeof fonts.weight;
export type TextAlign = 'auto' | 'center' | 'left' | 'justify' | 'right';
