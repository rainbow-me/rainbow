//
//  TransactionListViewController.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

fileprivate struct TransactionSection {
  var month: Date
  var transactions: [Transaction]
}

class TransactionListViewContainer: UIView {
  @objc var transactions: [Transaction] = [] {
    didSet {
      let groups = Dictionary(grouping: self.transactions) { (transaction) in
          return firstDayOfMonth(date: transaction.mined_at)
      }
      sections = groups.map(TransactionSection.init(month:transactions:))
      sections.sort { (lhs, rhs) in lhs.month > rhs.month }
      tableView.reloadData()
    }
  }
  @objc lazy var onItemPress: RCTBubblingEventBlock = {_ in}
  
  fileprivate var sections = [TransactionSection]()
  
  var bridge: RCTBridge
  var tableView: UITableView
  
  init(bridge: RCTBridge) {
    self.bridge = bridge
    self.tableView = UITableView()
    
    super.init(frame: CGRect.zero)
    
    tableView.dataSource = self
    tableView.delegate = self
    tableView.rowHeight = 60
    tableView.separatorStyle = UITableViewCell.SeparatorStyle.none
    tableView.register(UINib(nibName: "TransactionListViewCell", bundle: nil), forCellReuseIdentifier: "TransactionListViewCell")
    
    addSubview(tableView)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func layoutSubviews() {
    tableView.frame = self.bounds
  }
  
  private func firstDayOfMonth(date: Date) -> Date {
      let calendar = Calendar.current
      let components = calendar.dateComponents([.year, .month], from: date)
      return calendar.date(from: components)!
  }
}

extension TransactionListViewContainer: UITableViewDataSource, UITableViewDelegate {
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    let section = self.sections[section]
    return section.transactions.count
  }
  
  func numberOfSections(in tableView: UITableView) -> Int {
    return sections.count
  }
  
  func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
    return 40
  }
  
  func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
    let view = UIView(frame: CGRect(x: 0, y: 0, width: frame.width, height: 40))
    view.backgroundColor = .white

    let label = UILabel(frame: CGRect(x: 20, y: 0, width: view.frame.width, height: view.frame.height))

    let section = sections[section]
    let date = section.month
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "MMMM yyyy"
    label.text = dateFormatter.string(from: date)
    label.font = .boldSystemFont(ofSize: 18)
    view.addSubview(label)

    return view
  }
  
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let identifier = "TransactionListViewCell"
    let cell = tableView.dequeueReusableCell(withIdentifier: identifier, for: indexPath) as! TransactionListViewCell
    
    let section = sections[indexPath.section]
    let transaction = section.transactions[indexPath.row]
    
    cell.set(transaction: transaction)
    cell.selectionStyle = .none
    
    return cell;
  }
 
  /// Show incoming transactions green and outgoing transactions gray
  func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
    let transaction = transactions[indexPath.row];
    if (transaction.type == "Sent") {
      (cell as! TransactionListViewCell).nativeDisplay.textColor = UIColor(red:0.15, green:0.16, blue:0.18, alpha:1.0)
      (cell as! TransactionListViewCell).nativeDisplay.text = "- " + transaction.nativeDisplay
    } else {
      (cell as! TransactionListViewCell).nativeDisplay.textColor = UIColor(red:0.25, green:0.80, blue:0.09, alpha:1.0)
    }
    
  }
  
  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    let cell = tableView.cellForRow(at: indexPath)
    UIView.animate(withDuration: 0.15, animations: {
      cell?.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
    }, completion: { _ in
      UIView.animate(withDuration: 0.15, animations: {
        cell?.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
      })
    })
    self.onItemPress(["rowIndex": indexPath.row])
  }
  
  func tableView(_ tableView: UITableView, didHighlightRowAt indexPath: IndexPath) {
    let cell = tableView.cellForRow(at: indexPath)
    UIView.animate(withDuration: 0.15, animations: {
      cell?.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
    })
  }
  
  func tableView(_ tableView: UITableView, didUnhighlightRowAt indexPath: IndexPath) {
    let cell = tableView.cellForRow(at: indexPath)
    UIView.animate(withDuration: 0.15, animations: {
      cell?.transform = CGAffineTransform(scaleX: 1.0, y: 1.0)
    })
  }
}
