//
//  TransactionViewModelTransactionItem.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

class TransactionViewModelTransactionItem : TransactionViewModelProtocol {
  var sections: [TransactionSectionProtocol] = [TransactionSection]()
  var onItemPress: RCTBubblingEventBlock = { _ in }
  var type: TransactionSectionTypes = .transactions

  init(transactions: [Transaction]) {
    var groups: [Date: [Transaction]] = [:]
    let calendar = Calendar.current
    
    for transaction in transactions {
      var date = groupByDate(transaction.minedAt)
      
      if calendar.isDateInToday(date) || calendar.isDateInYesterday(date) {
        if groups[date] == nil {
          groups[date] = []
        }
        groups[date]!.append(transaction)
      } else {
        let dateComponents = calendar.dateComponents([.year, .month], from: date)
        date = calendar.date(from: dateComponents)!
        
        if groups[date] == nil {
          groups[date] = []
        }
        
        groups[date]!.append(transaction)
      }
    }
    
    sections = groups.map(TransactionSection.init(date:data:))
    sections.sort { (lhs, rhs) in lhs.date > rhs.date }
  }
  
  private func groupByDate(_ date: Date) -> Date {
    let calendar = Calendar.current
    let components = calendar.dateComponents([.year, .month, .day], from: date)
    return calendar.date(from: components)!
  }
}
