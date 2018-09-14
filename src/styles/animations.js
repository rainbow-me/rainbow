const keyframes = {
  badge: {
    from: { scale: 0, translateY: 1 },
    to: { scale: 1, translateY: 0 },
  },
  button: {
    from: { scale: 1, translateY: 0 },
    to: { scale: 0.80, translateY: 1 },
  },
};

const spring = {
  badge: {
    friction: 13,
    tension: 145,
  },
  default: {
    friction: 44,
    tension: 1000,
  },
};

export default {
  keyframes,
  spring,
};
