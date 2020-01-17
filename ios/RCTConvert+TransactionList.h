//
//  RCTConvert+TransactionList.h
//  Rainbow
//
//  Created by Alexey Kureev on 04/01/2020.
//

#ifndef RCTConvert_TransactionList_h
#define RCTConvert_TransactionList_h

#import <React/RCTConvert.h>
#import "Transaction.h"

@interface RCTConvert (TransactionList)

+ (NSArray<Transaction *> *)Transactions:(id)json;

@end

@implementation RCTConvert (TransactionList)

+ (NSArray<Transaction*> *)Transactions:(id)json
{
  json = [self NSArray:json];
  NSMutableArray *result = [[NSMutableArray alloc] init];
  
  for (id t in json) {
    NSDictionary *data = [self NSDictionary:t];
    Transaction *transaction = [[Transaction alloc] init];
    transaction.status = [data[@"status"] capitalizedString];
    transaction.symbol = data[@"symbol"];
    if (data[@"asset"][@"icon_url"] != [NSNull null]) {
      transaction.coinImage = data[@"asset"][@"icon_url"];
    }
    transaction.from = data[@"from"];
    transaction.to = data[@"to"];
    transaction.coinName = data[@"name"];
    transaction.nativeDisplay = data[@"native"][@"display"];
    transaction.balanceDisplay = data[@"balance"][@"display"];
    transaction.tHash = data[@"hash"];
    transaction.type = data[@"type"];
    transaction.pending = [[data valueForKey:@"pending"] boolValue];
    transaction.minedAt = [NSDate dateWithTimeIntervalSince1970: [data[@"minedAt"] doubleValue]];
    
    [result addObject:transaction];
  }
  return result;
}

@end

#endif /* RCTConvert_TransactionList_h */
