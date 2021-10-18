//
//  RecyclerRow.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "RecyclerRowWrapper.h"
#import <React/RCTView.h>
#import "CellStorage.h"


@implementation RecyclerRowWrapper : RCTView
- (instancetype)init {
  if (self = [super init]) {
    self.reparented = NO;
  }
  return self;
}

- (void) addSubview:(UIView *)view {
  [super addSubview:view];
  [((CellStorage*)self.superview) notifyNewViewAvailable];
}

@end

@implementation RecyclerRowWrapperManager

RCT_EXPORT_MODULE(RecyclerRowWrapper)

- (RCTView *)view
{
  return [[RecyclerRowWrapper alloc] init];
}


@end
