## React Native Animated Charts

The library provides a set of components and helpers for building complex and beautiful animated charts.

The library was designed to create aesthetic, animated (so far only linear) charts based on a given input. 
The main assumptions of the library were to create smooth transitions between subsequent data sets. For this reason,
we have discovered a shortage of existing libraries related to the charts.
The current package was created as part of the [Rainbow.me project](https://rainbow.me/) project and for this reason it was not designed as a complete and comprehensive solution for displaying various types of charts. However, we are now using more charts in the whole application, so we believe that the number of functionalities in the application will gradually grow. 
Additionally, we are open to new Pull Requests. We want this library to become popular and complete thanks to community activity.

It's a part of the [Rainbow.me project](https://rainbow.me/). 

## TODO
The library has been released in a production-ready version. 
We use it inside the [Rainbow.me project](https://rainbow.me/) so it's verified for use in production. 
However, it relies on [React Native Reanimated 2.0](https://docs.swmansion.com/react-native-reanimated/) in the alpha version thus it might not work perfectly. 
Test it deeply before using it. Until the stable release of Reanimated, I think it's worth not marking this library as stable.
Although the library works with Reanimated without any changes, we faced a few issues related to our (quite advanced) usage of the library.
Thus we made some hacks we're not very proud of and it's for 99% something you should not do. However, if you see some crashes, you may try one of our hacks. 

There're a few things left to make it polished regarding linear charts:
- [] cleanup API. `ChartProvider` and `ChartPath` have been split for two components to separated responsibilities of providing data and displaying charts. 
I'm still not sure if it's a good move so we can decide to move some props from one to another or connect them inside one component.
- [] Support for gestures - pinching, swiping, etc.
- [] more parameters regarding interpolation, smoothing, and animations (i.e. allow to override `springConfig` and `timingConfig`)


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

The library is verified on `2.0.0-alpha.6` version of reanimated.

## Example

## API
The library has been designed to provide as much flexibility as possible with the component-based API for easy integration with existing applications. 

### Linear charts

### ChartProvider
The whole chart's structure has to be wrapped with `ChartProvider`. It's responsible for data managing and itself does not have a visual impact on the layout. Under the hood, it uses context API to simplify manipulation with other components. The rule is to use one data series for each wrapper. 


### Candle Charts
 
### Pie charts



