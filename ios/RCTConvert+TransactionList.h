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

+ (TransactionData *)TransactionData:(id)json
{
  json = [self NSDictionary:json];
  TransactionData *data = [[TransactionData alloc] init];
  data.requests = [RCTConvert TransactionRequests:[json valueForKey:@"requests"]];
  data.transactions = [RCTConvert Transactions:[json valueForKey:@"transactions"]];
  return data;
}

+ (NSArray<Transaction*> *)Transactions:(id)json
{
  json = [self NSArray:json];
  NSMutableArray *result = [[NSMutableArray alloc] init];
  int index = 0;
  
  for (id t in json) {
    NSDictionary *data = [self NSDictionary:t];
    Transaction *transaction = [[Transaction alloc] init];
    if (data[@"status"] != [NSNull null]) {
       transaction.status = data[@"status"];
    }
    if (data[@"title"] != [NSNull null]) {
       transaction.title = data[@"title"];
    }
    if (data[@"description"] != [NSNull null]) {
       transaction.transactionDescription = data[@"description"];
    }
    if (data[@"symbol"] != [NSNull null]) {
       transaction.symbol = data[@"symbol"];
    }
    if (data[@"address"] != [NSNull null]) {
      transaction.address = data[@"address"];
    }
    if (data[@"asset"][@"icon_url"] != [NSNull null]) {
      transaction.coinImage = data[@"asset"][@"icon_url"];
    }
    if (data[@"from"] != [NSNull null]) {
      transaction.from = data[@"from"];
    }
    if (data[@"to"] != [NSNull null]) {
      transaction.to = data[@"to"];
    }
    if (data[@"name"] != [NSNull null]) {
      transaction.coinName = data[@"name"];
    }
    if(data[@"native"] != [NSNull null] && data[@"native"][@"display"] != [NSNull null]){
      transaction.nativeDisplay = data[@"native"][@"display"];
    }
    if(data[@"balance"] != [NSNull null] && data[@"balance"][@"display"] != [NSNull null]){
      transaction.balanceDisplay = data[@"balance"][@"display"];
    }
    if (data[@"type"] != [NSNull null]) {
      transaction.type = data[@"type"];
    }
    if ([data valueForKey:@"pending"] != [NSNull null]) {
      transaction.pending = [[data valueForKey:@"pending"] boolValue];
    }
    if ([data valueForKey:@"network"] != [NSNull null]) {
      transaction.network = [data valueForKey:@"network"];
    }    
    if (data[@"minedAt"] != [NSNull null]) {
      transaction.minedAt = [NSDate dateWithTimeIntervalSince1970: [data[@"minedAt"] doubleValue]];
    } else {
      transaction.minedAt = [[NSDate alloc] init];
    }
    
    transaction.originalIndex = [[NSNumber alloc] initWithInt:index];
    index+=1;
    
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
    request.payloadId = data[@"payload"][@"id"];
    request.clientId = data[@"clientId"];
    request.dappName = data[@"dappName"];
    request.imageUrl = data[@"imageUrl"];
    request.requestedAt = [NSDate dateWithTimeIntervalSince1970: [data[@"displayDetails"][@"timestampInMs"] doubleValue] / 1000.0];
    
    [result addObject:request];
  }
  return result;
}

@end
