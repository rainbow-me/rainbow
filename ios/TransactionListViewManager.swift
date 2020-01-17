//
//  TransactionListViewManager.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

@objc(TransactionListViewManager)
class TransactionListViewManager: RCTViewManager {
  
  override func view() -> UIView! {
    return TransactionListViewContainer()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
