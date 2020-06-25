//
//  RainbowText.m
//  Rainbow
//
//  Created by Michał Osadnik on 24/06/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>


@interface RainbowText:UILabel

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
  CFAbsoluteTime _time;
  
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
  _timer = [NSTimer scheduledTimerWithTimeInterval:_interval / 1000  target:self selector:@selector(animate) userInfo:nil repeats:YES];
  _fmt = [[NSNumberFormatter alloc] init];
  _fmt.numberStyle = NSNumberFormatterDecimalStyle;
  _fmt.maximumFractionDigits = 9;
  _fmt.minimumFractionDigits = 9;
  _time = NSDate.date.timeIntervalSince1970;
  self.font = [UIFont fontWithName:@"SFRounded-Bold" size:16];
}

- (void) animate {
  double diff = _time - NSDate.date.timeIntervalSince1970;
  double value = _initialValue + _stepPerDay * diff / 24 / 60 / 60;
  
  NSString *newValue;
  if (_isSymbolStablecoin) {
    newValue = [NSString stringWithFormat:@"$%@", [_fmt stringFromNumber:@(value)]];
  } else {
    newValue = [NSString stringWithFormat:@"%@ %@", [_fmt stringFromNumber:@(value)], _symbol];
  }
  
  self.attributedText = [[NSAttributedString alloc] initWithString:newValue attributes: @{
    NSKernAttributeName : @(0.2f)
  }];
  
}


- (instancetype)init {
  if (self = [super init]) {
    _timer = nil;
    UILabel *label = [[UILabel alloc] init];
    label.text = @"123";
    [self addSubview:label];
    
  }
  
  return self;
}

@end

@interface RainbowTextManager : RCTViewManager

@end

@implementation RainbowTextManager


RCT_EXPORT_VIEW_PROPERTY(animationConfig, NSDictionary)


RCT_EXPORT_MODULE(RainbowText)

- (UIView *)view
{
  
  return [[RainbowText alloc] init];
}

@end

