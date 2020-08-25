## React Native Animated Charts

The library provides a set of components and helpers for building complex and beautiful animated linear (only - for now) charts.
It's a part of the [Rainbow.me project](https://rainbow.me/). 

## TODO
The library has been released in a production-ready version. 
We use it inside the Rainbow app so it's verified for use in production. 
However, it relies on [React Native Reanimated 2.0](https://docs.swmansion.com/react-native-reanimated/) in the alpha version thus it might not work perfectly. 
Test it deeply before using it. Until the stable release of Reanimated, I think it's worth not marking this library as stable.

There're a few things left to make it polished:
- [] cleanup API. `ChartProvider` and `ChartPath` have been split for two components to separated responsibilities of providing data and displaying charts. 
I'm still not sure if it's a good move so we can decide to move some props from one to another or connect them inside one component.
- [] Different types of charts e.g. Pie or candle
- [] Support for gestures - pinching, swiping, etc.
- [] more parameters regarding interpolation, smoothing, and animations

## Installation

1. Install [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/next/installation) in the newest version. 
2. 
```bash
yarn add react-native-animated-charts
```
3. If you want to use haptic feedback on the press in / out, install
```bash
yarn add react-native-haptic-feedback
```

## Example

## API
The library has been designed to provide as much flexibility as possible with the component-based API for easy integration with existing applications. 



### ChartProvider
The whole chart's structure has to be wrapped with `ChartProvider`. It's responsible for data managing and itself does not have a visual impact on the layout. Under the hood, it uses context API to simplify manipulation with other components. The rule is to use one data series for each wrapper. 


### Linear chart

### Char Chart
 
### Pie chart



