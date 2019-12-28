//
//  TransactionListViewManager.m
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "React/RCTViewManager.h"
@interface RCT_EXTERN_MODULE(TransactionListViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(transactions, NSArray)

@end
