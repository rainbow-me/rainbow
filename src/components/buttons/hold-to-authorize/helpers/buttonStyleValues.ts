// TODO: try fixing any
export const getButtonDisabledBgColor = (colors: any) => ({
  dark: colors.darkGrey,
  light: colors.lightGrey,
});

// TODO: try fixing any
export const getButtonShadows = (colors: any) => ({
  default: [
    [0, 3, 5, colors.shadow, 0.2],
    [0, 6, 10, colors.shadow, 0.14],
    [0, 1, 18, colors.shadow, 0.12],
  ],
  disabled: [
    [0, 2, 6, colors.shadow, 0.06],
    [0, 3, 9, colors.shadow, 0.08],
  ],
});
