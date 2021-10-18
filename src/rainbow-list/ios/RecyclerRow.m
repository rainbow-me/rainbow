//
//  RecyclerRow.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "RecyclerRow.h"
#import "CellStorage.h"
#import "RCTUIManager.h"
#import "events/OnRecycle.h"
//#import "RCTUIManagerObserverCoordinator.h"
#import "UltraFastAbstractComponentWrapper.h"

@implementation RecyclerRow {
  NSInteger _index;
  RCTBridge* _bridge;
  NSMutableArray<UltraFastAbstractComponentWrapper *>* _ultraFastComponents;
}

-(void)setBounds:(CGRect)bounds {
  [super setBounds:bounds];
  UIView* parent = self.superview.superview;
  if ([parent isKindOfClass:CellStorage.class]) {
    ((CellStorage*) parent).initialRect = bounds;
  }
}

-(instancetype)initWithBridge:(RCTBridge *)bridge {
  if (self = [super init]) {
    _index = -1;
    _bridge = bridge;
    _ultraFastComponents = [NSMutableArray new];
  }
  return self;
}

-(void)recycle:(NSInteger)index {
  [_bridge.eventDispatcher sendEvent:[[RCTOnRecycleEvent alloc] initWithReactTag:self.reactTag position:index prevPosition:_index]];
  _index = index;
  for (UltraFastAbstractComponentWrapper* component in _ultraFastComponents) {
    [component notifyNewData:index];
  }
}

-(void)registerUltraFastComponent:(UltraFastAbstractComponentWrapper*)component {
    [_ultraFastComponents addObject:component];
  if (_index != -1) {
    [component notifyNewData:_index];
  }
}

@end


@implementation RecyclerRowManager

RCT_EXPORT_MODULE(RecyclerRow)
RCT_EXPORT_VIEW_PROPERTY(onRecycle, RCTDirectEventBlock)


- (RCTView *)view {
  return [[RecyclerRow alloc] initWithBridge:self.bridge];
}

@end
