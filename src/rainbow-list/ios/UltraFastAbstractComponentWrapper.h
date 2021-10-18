//
//  UltraFastComponentWrapper.h
//  Pods
//
//  Created by Michał Osadnik on 10/10/2021.
//

#import <React/RCTView.h>
#import <React/RCTViewManager.h>
#import "RecyclerRow.h"

@interface UltraFastAbstractComponentWrapperManager: RCTViewManager

@end


@interface UltraFastAbstractComponentWrapper: RCTView
@property (nonatomic) NSString* binding;
@property (nonatomic) RecyclerRow* boundRow;
-(void)notifyNewData:(NSInteger)index;
@end
