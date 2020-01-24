//
//  RCTConvert+TransactionList.h
//  Rainbow
//
//  Created by Alexey Kureev on 04/01/2020.
//

#import <React/RCTConvert.h>
#import "Rainbow-Swift.h"

@interface RCTConvert (TransactionList)

+ (NSArray<Transaction *> *)Transactions:(id)json;
+ (NSArray<TransactionRequest *> *)TransactionRequests:(id)json;

@end

@implementation RCTConvert (TransactionList)

+ (NSDictionary *)TransactionData:(id)json
{
  json = [self NSDictionary:json];
  return @{
    @"requests": [RCTConvert TransactionRequests:[json valueForKey:@"requests"]],
    @"transactions": [RCTConvert Transactions:[json valueForKey:@"transactions"]]
  };
}

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
    transaction.type = data[@"type"];
    transaction.pending = [[data valueForKey:@"pending"] boolValue];
    transaction.minedAt = [NSDate dateWithTimeIntervalSince1970: [data[@"minedAt"] doubleValue]];
    
    [result addObject:transaction];
  }
  return result;
}

+ (NSArray<TransactionRequest*> *)TransactionRequests:(id)json
{
  json = [self NSArray:json];
  NSMutableArray *result = [[NSMutableArray alloc] init];
  
  for (id t in json) {
    NSDictionary *data = [self NSDictionary:t];
    TransactionRequest *request = [[TransactionRequest alloc] init];
    request.clientId = data[@"clientId"];
    request.dappName = data[@"dappName"];
    request.imageUrl = data[@"imageUrl"];
    request.requestedAt = [[NSDate alloc] initWithTimeIntervalSince1970: [data[@"displayDetails"][@"timestampInMs"] doubleValue] / 1000.0];
    
    [result addObject:request];
  }
  return result;
}

@end
