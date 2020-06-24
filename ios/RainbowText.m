//
//  RainbowText.m
//  Rainbow
//
//  Created by Michał Osadnik on 24/06/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <React/RCTViewManager.h>
#import <React/RCTTextViewManager.h>
#import <React/RCTTextView.h>
#import <React/RCTSinglelineTextInputViewManager.h>
#import <React/RCTSinglelineTextInputView.h>
#import <React/RCTUIManager.h>
#import <React/RCTLog.h>
#import <React/RCTUITextField.h>
#import <React/RCTBridgeModule.h>


@interface RainbowText:RCTSinglelineTextInputView

@end


@implementation RainbowText {
  NSTimer* _timer;
  int _decimals;
  float _initialValue;
  double _interval;
  float _stepPerDay;
  BOOL _isSymbolStablecoin;
  NSString* _symbol;
  NSNumberFormatter* _fmt;
  int _it;
  NSMutableDictionary<NSNumber*, NSNumber*>* _framesFromChanges;

}

- (void) setAnimationConfig:(NSDictionary*) config {
  [_timer invalidate];
  _timer = nil;
  if (config[@"initialValue"] == nil) {
    return;
  }
  _decimals = ((NSNumber*) config[@"decimals"]).intValue;
  _initialValue = ((NSNumber*)config[@"initialValue"]).floatValue;
  _interval = ((NSNumber*) config[@"interval"]).doubleValue;
  _stepPerDay = ((NSNumber*) config[@"stepPerDay"]).floatValue;
  _isSymbolStablecoin = ((NSNumber*) config[@"isSymbolStablecoin"]).boolValue;
  _symbol = config[@"symbol"];
  _framesFromChanges = [NSMutableDictionary new];
  _timer = [NSTimer scheduledTimerWithTimeInterval:_interval / 1000  target:self selector:@selector(animate) userInfo:nil repeats:YES];
  _fmt = [[NSNumberFormatter alloc] init];
  _it = 0;
  _fmt.numberStyle = NSNumberFormatterDecimalStyle;
  _fmt.maximumFractionDigits = 9;
  _fmt.minimumFractionDigits = 9;
}

- (void) animate { //);
  double value = _initialValue + _stepPerDay * _it * _interval / 24 / 60 / 60 / 1000;
  _it++;

  NSString *newValue;
  if (_isSymbolStablecoin) {
    newValue = [NSString stringWithFormat:@"$%@", [_fmt stringFromNumber:@(value)]];
  } else {
    newValue = [NSString stringWithFormat:@"%@ %@", [_fmt stringFromNumber:@(value)], _symbol];
  }
  
  NSMutableAttributedString* as = [[NSMutableAttributedString alloc] initWithString:newValue];
  ((RCTUITextField* )[self.subviews firstObject]).attributedText = as;

}

- (instancetype)initWithBridge:(RCTBridge *)bridge {
  if (self = [super initWithBridge:bridge]) {
   // _isTraversed = NO;
    _timer = nil;
  }
  
  return self;
}


@end

@interface RainbowTextManager : RCTSinglelineTextInputViewManager<RCTBridgeModule>

@end

@implementation RainbowTextManager


RCT_EXPORT_VIEW_PROPERTY(animationConfig, NSDictionary)


RCT_EXPORT_MODULE(RainbowText)

- (UIView *)view
{
  return [[RainbowText alloc] initWithBridge:self.bridge];
}

@end

