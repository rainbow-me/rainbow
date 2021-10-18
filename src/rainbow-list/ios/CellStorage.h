//
//  CellStorage.h
//  Pods
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import "RecyclerRow.h"
#import <React/RCTEventDispatcher.h>

@interface CellStorageManager : RCTViewManager

@end

@class ReusableCell;

@interface CellStorage: RCTView
@property CGRect initialRect;
@property (nonatomic) NSString* type;
@property(nonatomic, copy) RCTDirectEventBlock onMoreRowsNeeded;
- (RecyclerRow *) getFirstAvailableRow;
- (void) dequeueView:(ReusableCell*)cell;
- (void) enqueueForView:(ReusableCell *)cell;
- (void) notifyNeedMoreCells;
- (void) notifyNewViewAvailable;
- (instancetype) initWithBridge:(RCTBridge*)bridge;
@end
