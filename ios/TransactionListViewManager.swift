//
//  TransactionListViewManager.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//


@objc(TransactionListViewManager)
class TransactionListViewManager: RCTViewManager {
  
  override func view() -> UIView! {
    return TransactionListViewContainer(bridge: self.bridge)
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
