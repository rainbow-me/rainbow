//
//  RainbowText.m
//  Rainbow
//
//  Created by Michał Osadnik on 24/06/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>
#import <CoreText/CoreText.h>


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
  NSMutableArray<NSArray<NSNumber*>*>* _annealingColor;
  NSMutableArray *_colorsMap;
  int _colorThrottle;
  int _currentThrottle;
  NSString* _prevString;
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
  _colorThrottle = ((NSNumber*) config[@"colorThrottle"]).intValue;
  _currentThrottle = 0;
  _stepPerDay = ((NSNumber*) config[@"stepPerDay"]).floatValue;
  NSString* color = ((NSNumber*) config[@"color"]).stringValue;
  _isSymbolStablecoin = ((NSNumber*) config[@"isSymbolStablecoin"]).boolValue;
  _symbol = config[@"symbol"];
  _timer = [NSTimer scheduledTimerWithTimeInterval:_interval / 1000  target:self selector:@selector(animate) userInfo:nil repeats:YES];
  _fmt = [[NSNumberFormatter alloc] init];
  _fmt.numberStyle = NSNumberFormatterDecimalStyle;
  _fmt.maximumFractionDigits = _decimals;
  _fmt.minimumFractionDigits = _decimals;
  _time = NSDate.date.timeIntervalSince1970;
  _annealingColor = [NSMutableArray new];

  unsigned rgbValue = 0;
  NSScanner *scanner = [NSScanner scannerWithString:color];
  [scanner setScanLocation:1];
  [scanner scanHexInt:&rgbValue];
  float r = ((rgbValue & 0xFF0000) >> 16)/255.0;
  float g = ((rgbValue & 0xFF00) >> 8)/255.0;
  float b = (rgbValue & 0xFF)/255.0;

  _colorsMap = [NSMutableArray new];
  for (float i = 1.0f; i > 0; i -= 0.1f) {
    [_colorsMap addObject:[UIColor colorWithRed: r * i green:g * i blue:b * i alpha:1]];
  }

  UIFont* font = [UIFont fontWithName:@"SFRounded-Bold" size:16];

  UIFontDescriptor *const existingDescriptor = [font fontDescriptor];

  NSDictionary *const fontAttributes = @{

    UIFontDescriptorFeatureSettingsAttribute: @[
        @{
          UIFontFeatureTypeIdentifierKey: @(kNumberSpacingType),
          UIFontFeatureSelectorIdentifierKey: @(kMonospacedNumbersSelector)
        }
    ]};

  UIFontDescriptor *const monospacedDescriptor = [existingDescriptor  fontDescriptorByAddingAttributes: fontAttributes];

  self.font = [UIFont fontWithDescriptor: monospacedDescriptor size: [font pointSize]];
}

- (void) animate {

  double diff = NSDate.date.timeIntervalSince1970 - _time;
  double value = _initialValue + _stepPerDay * diff / 24 / 60 / 60;

  NSString *newValue;
  if (_isSymbolStablecoin) {
    newValue = [NSString stringWithFormat:@"$%@", [_fmt stringFromNumber:@(value)]];
  } else {
    newValue = [NSString stringWithFormat:@"%@ %@", [_fmt stringFromNumber:@(value)], _symbol];
  }

  NSMutableAttributedString *attributedText = [[NSMutableAttributedString alloc] initWithString:newValue attributes: @{
    NSKernAttributeName : @(0.2f)
  }];

  NSString* newString = attributedText.string;
  NSMutableArray<NSNumber *>* whatHasChanged = [[NSMutableArray alloc] init];

  if (newString.length == self.attributedText.string.length) {
    NSUInteger len = newString.length;
    if (_currentThrottle == 0) {
      if (_prevString == nil) {
        _prevString = newString;
      }
      if (_annealingColor.count == 10) {
        [_annealingColor removeObjectAtIndex:0];
      }
      for (NSUInteger i = 0; i < len; i++){
        if ([newString characterAtIndex: i] != [_prevString characterAtIndex: i]){
          [whatHasChanged addObject:@(i)];
        }
      }

      [_annealingColor addObject:whatHasChanged];
      _prevString = self.attributedText.string;
    }

    NSUInteger queueLen = _annealingColor.count;

    for (int colorIdx = 0; colorIdx < queueLen; colorIdx++) {
      NSArray *changedIdxs = _annealingColor[colorIdx];
      for (NSNumber *inx in changedIdxs) {
        [attributedText setAttributes:@{NSForegroundColorAttributeName:_colorsMap[_annealingColor.count - colorIdx - 1]} range:NSMakeRange(inx.intValue, len - inx.intValue - (_isSymbolStablecoin ? 0 : _symbol.length))];
      }
    }
  }

  self.attributedText = attributedText;
  _currentThrottle++;
  _currentThrottle%=(_colorThrottle + 1);
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

