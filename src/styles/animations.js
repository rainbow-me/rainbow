const keyframes = {
  button: {
    from: { scale: 1, translateY: 0 },
    to: { scale: 0.80, translateY: 1 },
  },
};

const spring = {
  default: {
    friction: 44,
    tension: 1000,
  },
};

export default {
  keyframes,
  spring,
};
