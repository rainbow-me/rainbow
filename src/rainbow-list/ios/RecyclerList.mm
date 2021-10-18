//
//  RecyclerList.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "RecyclerList.h"
#import <React/RCTView.h>
#import "rainbow-me-ultimate-list.h"

@implementation RecyclerListManager

RCT_EXPORT_MODULE(RecyclerListView) // TODO osdnk rename to RecyclerList
RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber);
RCT_EXPORT_VIEW_PROPERTY(isRefreshing, BOOL);
RCT_EXPORT_VIEW_PROPERTY(onRefresh, RCTDirectEventBlock);


- (instancetype)init {
  if (self = [super init]) {
    std::function<void(int)> callback = [](int value) {
      [RecyclerController notifyNewData:value];
    };
    RecyclerController.lists = [NSMutableDictionary new];
    osdnk::ultimatelist::setNotifyNewData(callback);
  }
  return self;
}

- (UIView *)view
{
  RecyclerController* rc = [[RecyclerController alloc] init];
  ((SizeableView* )rc.view).controller = rc;
  return rc.view;
}

@end
