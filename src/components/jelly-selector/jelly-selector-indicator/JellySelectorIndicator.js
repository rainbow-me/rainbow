import { createElement } from 'react';

export default function JellySelectorIndicator({
  backgroundColor,
  height,
  renderIndicator,
  translateX,
  width,
  ...props
}) {
  return createElement(renderIndicator, {
    ...props,
    backgroundColor,
    height,
    marginBottom: height * -1,
    translateX,
    width,
    zIndex: 10,
  });
}
