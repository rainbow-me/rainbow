//
//  CellStorage.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "CellStorage.h"
#import <React/RCTView.h>
#import "RecyclerController.h"
#import "RecyclerRowWrapper.h"
#import "OnRecycle.h"

@interface NSMutableArray (QueueAdditions)
- (id) dequeue;
@end

@implementation NSMutableArray (QueueAdditions)
- (id) dequeue {
  if (self.count == 0) {
    return nil;
  }
  id headObject = [self objectAtIndex:0];
  if (headObject != nil) {
    [self removeObjectAtIndex:0];
  }
  return headObject;
}
@end


@implementation CellStorage {
  NSMutableArray<ReusableCell *> *_viewsQueue;
  RCTBridge* _bridge;
  int _cellsNeeded;
}

- (instancetype)initWithBridge:(RCTBridge*)bridge {
  if (self = [super init]) {
    _cellsNeeded = 2;
    _bridge = bridge;
    _viewsQueue = [NSMutableArray new];
  }
  return self;
}

- (void) notifyNeedMoreCells {
  _cellsNeeded++;
  RCTOnRecycleEvent* event = [[RCTOnRecycleEvent alloc] initWithReactTag:self.reactTag cells:_cellsNeeded];
  [_bridge.eventDispatcher sendEvent:event];
}

- (RecyclerRow *) getFirstAvailableRow {
  for (UIView* child in self.subviews) {
    if (((RecyclerRowWrapper*)child).reparented == NO && child.subviews.count == 1) {
      return (RecyclerRow *) child.subviews.firstObject;
    }
  } 
  return nil;
}

- (void) enqueueForView:(ReusableCell*)cell {
  [_viewsQueue addObject:cell];
}

- (void) dequeueView:(ReusableCell*)cell {
  [_viewsQueue removeObject:cell];
}

//- (void)didAddSubview:(UIView *)subview {
//  [super didAddSubview:subview];
//  //if (((RecyclerRowWrapper*)subview).reparented == NO && subview.subviews.count == 1) {
//    ReusableCell* cell = [_viewsQueue firstObject];
//    if (cell != nil) {
//      [cell notifyNewViewAvailable];
//    }
//
//  //}
//  // TODO osdnk maybe try making this faster;
//
//}

- (void) notifyNewViewAvailable {
  ReusableCell* cell = [_viewsQueue firstObject];
  [cell notifyNewViewAvailable];
}

- (void)addSubview:(UIView *)view {
  [super addSubview:view];
  [self notifyNewViewAvailable];
}

@end

@implementation CellStorageManager

RCT_EXPORT_MODULE(CellStorage)
RCT_EXPORT_VIEW_PROPERTY(onMoreRowsNeeded, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(type, NSString)

- (RCTView *)view {
  return [[CellStorage alloc] initWithBridge:self.bridge];
}


@end
