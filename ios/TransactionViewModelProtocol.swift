//
//  TransactionViewModelProtocol.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

enum TransactionSectionTypes {
  case requests
  case transactions
}

protocol TransactionViewModelProtocol {
  var type: TransactionSectionTypes { get }
  var sections: [TransactionSectionProtocol] { get }
}

protocol TransactionSectionProtocol {
  var date: Date { get }
  var data: [AnyObject] { get }
  var type: TransactionSectionTypes { get }
  var title: String { get }
}

extension TransactionSectionProtocol {
  var title: String {
    let calendar = Calendar.current
    if type == .requests {
      return "Requests"
    } else {
      if calendar.isDateInToday(date) {
        return "Today"
      } else if calendar.isDateInYesterday(date) {
        return "Yesterday"
      } else if calendar.isDate(date, equalTo: Date(), toGranularity: .month) {
        return "This month"
      } else if calendar.isDate(date, equalTo: Date(), toGranularity: .year) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMMM"
        return dateFormatter.string(from: date)
      } else {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMMM yyyy"
        return dateFormatter.string(from: date)
      }
    }
  }
}
