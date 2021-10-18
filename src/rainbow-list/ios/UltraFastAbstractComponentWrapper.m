//
//  UltraFastComponentWrapper.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 10/10/2021.
//

#import "UltraFastAbstractComponentWrapper.h"
#import "RecyclerRow.h"

@implementation UltraFastAbstractComponentWrapper {
  BOOL _registered;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _registered = NO;
  }
  return self;
}


-(void)notifyNewData:(NSInteger)index{
  [self doesNotRecognizeSelector:_cmd];
}

- (void) tryRegistering {
  if (_registered || self.subviews.count == 0) {
    return;
  }
  UIView*p = self.superview;
  while(![p isKindOfClass:RecyclerRow.class] && p != nil) {
    p = p.superview;
  }
  if (p != nil) {
    self.boundRow = (RecyclerRow*) p;
    [((RecyclerRow *) p) registerUltraFastComponent:self];
    _registered = YES;
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self tryRegistering];
}

- (void)addSubview:(UIView *)view {
  [super addSubview:view];
  [self tryRegistering];
}

@end



@implementation UltraFastAbstractComponentWrapperManager
  
- (RCTView *)view {
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

RCT_EXPORT_VIEW_PROPERTY(binding, NSString)

@end




