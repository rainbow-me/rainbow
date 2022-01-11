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
  int _duration;
  float _initialValue;
  double _interval;
  float _stepPerDay;
  BOOL _isSymbolStablecoin;
  BOOL _darkMode;
  NSString* _symbol;
  NSNumberFormatter* _fmt;
  CFAbsoluteTime _time;
  NSMutableArray<NSArray<NSNumber*>*>* _annealingColor;
  NSMutableArray *_colorsMap;
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
  _duration = ((NSNumber*) config[@"duration"]).intValue;
  NSString* color = ((NSString*) config[@"color"]);
  _isSymbolStablecoin = ((NSNumber*) config[@"isSymbolStablecoin"]).boolValue;
  _darkMode = ((NSNumber*) config[@"darkMode"]).boolValue;
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
  float startR = _darkMode ?  0.878 : 0.145;
  float startG = _darkMode ?  0.91 : 0.161;
  float startB = _darkMode ?  1.00 : 0.18;
  float r = ((rgbValue & 0xFF0000) >> 16)/255.0 - startR;
  float g = ((rgbValue & 0xFF00) >> 8)/255.0 - startG;
  float b = (rgbValue & 0xFF)/255.0 - startB;
  self.textColor = _darkMode ? [UIColor colorWithRed:0.878 green:0.91 blue:1.00 alpha:1.00] : [UIColor colorWithRed:0.145 green:0.161 blue:0.18 alpha:1.0];

  _colorsMap = [NSMutableArray new];
  for (int i = _duration; i > 0; i--) {
    float factor = i / (float)_duration;
    [_colorsMap addObject:[UIColor colorWithRed: startR + r * factor green:startG + g * factor blue:startB + b * factor alpha:1]];
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

  NSString *newValue = [NSString stringWithFormat:@"%@ %@", [_fmt stringFromNumber:@(value)], _symbol];


  NSMutableAttributedString *attributedText = [[NSMutableAttributedString alloc] initWithString:newValue attributes: @{
    NSKernAttributeName:@(0.2f)
  }];

  NSString* newString = attributedText.string;
  NSMutableArray<NSNumber *>* whatHasChanged = [[NSMutableArray alloc] init];

  if (newString.length == self.attributedText.string.length) {
    NSUInteger len = newString.length;
    NSString *prevString = self.attributedText.string;
    if (_annealingColor.count == _duration) {
      [_annealingColor removeObjectAtIndex:0];
    }
    for (NSUInteger i = 0; i < len; i++){
      if ([newString characterAtIndex: i] != [prevString characterAtIndex: i]){
        [whatHasChanged addObject:@(i)];
      }
    }

    [_annealingColor addObject:whatHasChanged];

    NSUInteger queueLen = _annealingColor.count;

    for (int colorIdx = 0; colorIdx < queueLen; colorIdx++) {
      NSArray *changedIdxs = _annealingColor[colorIdx];
      for (NSNumber *inx in changedIdxs) {
        [attributedText  setAttributes:@{NSForegroundColorAttributeName:_colorsMap[_annealingColor.count - colorIdx - 1], NSKernAttributeName:@(0.2f)} range:NSMakeRange(inx.intValue, len - inx.intValue - _symbol.length)];
      }
    }
  }

  self.attributedText = attributedText;
}


- (instancetype)init {
  if (self = [super init]) {
    _timer = nil;
    UILabel *label = [[UILabel alloc] init];
    [self addSubview:label];

  }

  return self;
}

- (void) willMoveToSuperview: (UIView *) newSuperview {
    if (newSuperview == nil) {
      [_timer invalidate];
      _timer = nil;
    }
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

