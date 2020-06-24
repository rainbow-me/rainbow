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
  double _value;
  double _interval;
  double _stepPerMs;
  BOOL _isSymbolStablecoin;
  NSString* _symbol;
  
}

- (void) setAnimationConfig:(NSDictionary*) config {
  [_timer invalidate];
  _timer = nil;
  if (config[@"initialValue"] == nil) {
    return;
  }
  _decimals = ((NSNumber*) config[@"decimals"]).intValue;
  _value = ((NSNumber*)config[@"initialValue"]).doubleValue;
  _interval = ((NSNumber*) config[@"interval"]).doubleValue;
  _stepPerMs = ((NSNumber*) config[@"stepPerMs"]).doubleValue;;
  _isSymbolStablecoin = ((NSNumber*) config[@"isSymbolStablecoin"]).boolValue;
  _symbol = config[@"symbol"];
  _timer = [NSTimer scheduledTimerWithTimeInterval:_interval / 1000  target:self selector:@selector(animate) userInfo:nil repeats:YES];
}

- (void) animate { //);
  _value = _value + _stepPerMs * _interval;
  NSLog(@"%f", _stepPerMs);
  NSString *newValue;
  if (_isSymbolStablecoin) {
    newValue = [NSString stringWithFormat:@"$%f", _value];
  } else {
    newValue = [NSString stringWithFormat:@"%f %@", _value, _symbol];
  }
  ((RCTUITextField* )[self.subviews firstObject]).attributedText = [[NSAttributedString alloc] initWithString:newValue];
  
  
//  [((RCTUITextField* )[self.subviews firstObject]) setText:@"@sample"];

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

