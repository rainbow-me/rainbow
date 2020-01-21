//
//  TransactionListView.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import Foundation

fileprivate struct TransactionSection {
  var header: Date
  var transactions: [Transaction]
}

class TransactionListView: UIView {
  @objc lazy var onItemPress: RCTBubblingEventBlock = { _ in }
  @objc lazy var onReceivePress: RCTBubblingEventBlock = { _ in }
  @objc lazy var onCopyAddressPress: RCTBubblingEventBlock = { _ in }
  @objc var duration: TimeInterval = 0.15
  @objc var scaleTo: CGFloat = 0.97
  @objc var enableHapticFeedback: Bool = true
  @objc var hapticType: String = "selection"
  @objc var accountAddress: String? = nil {
    didSet {
      header.accountAddress.text = accountAddress
    }
  }
  @objc var transactions: [Transaction] = [] {
    /// Every time we receive a new set of transactions, regroup by minedAt in the format "MMMM yyyy"
    /// Then, re-render tableView with the new data
    didSet {
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
      
      sections = groups.map(TransactionSection.init(header:transactions:))
      sections.sort { (lhs, rhs) in lhs.header > rhs.header }
      tableView.reloadData()
    }
  }
  @objc func onReceivePressed(_ sender: UIButton) {
    self.onReceivePress([:])
  }
  @objc func onCopyAddressPressed(_ sender: UIButton) {
    let rect = sender.convert(sender.frame, to: self)
    self.onCopyAddressPress([
      "x": rect.origin.x,
      "y": rect.origin.y,
      "width": sender.frame.width,
      "height": sender.frame.height
    ])
  }
  
  fileprivate var sections = [TransactionSection]()
  
  let tableView = UITableView()
  let header: TransactionListViewHeader = TransactionListViewHeader.fromNib()
  let headerSeparator = UIView()
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    
    tableView.dataSource = self
    tableView.delegate = self
    tableView.rowHeight = 60
    tableView.delaysContentTouches = false
    tableView.separatorStyle = .none
    tableView.register(UINib(nibName: "TransactionListViewCell", bundle: nil), forCellReuseIdentifier: "TransactionListViewCell")
    
    header.addSubview(headerSeparator)
    header.receive.addTarget(self, action: #selector(onReceivePressed(_:)), for: .touchUpInside)
    header.copyAddress.addTarget(self, action: #selector(onCopyAddressPressed(_:)), for: .touchUpInside)
    
    headerSeparator.backgroundColor = UIColor(red:0.40, green:0.42, blue:0.45, alpha:0.05)
    tableView.tableHeaderView = header
    
    addSubview(tableView)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  /// React Native is known to re-render only first-level subviews. Since our tableView is a custom view that we add as a second-level subview, we need to relayout it manually
  override func layoutSubviews() {
    tableView.frame = self.bounds
    header.frame = CGRect(x: 0, y: 0, width: tableView.bounds.width, height: 200)
    headerSeparator.frame = CGRect(x: 20, y: header.frame.size.height - 2, width: tableView.bounds.width - 20, height: 2)
  }
  
  private func groupByDate(_ date: Date) -> Date {
    let calendar = Calendar.current
    let components = calendar.dateComponents([.year, .month, .day], from: date)
    return calendar.date(from: components)!
  }
}

extension TransactionListView: UITableViewDataSource, UITableViewDelegate {
  func numberOfSections(in tableView: UITableView) -> Int {
    return sections.count
  }
  
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    let section = self.sections[section]
    return section.transactions.count
  }
  
  func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
    return 60
  }
  
  func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
    let view = UIView(frame: CGRect(x: 0, y: 0, width: frame.width, height: 40))
    let label = UILabel(frame: CGRect(x: 20, y: 20, width: view.frame.width, height: view.frame.height))
    let calendar = Calendar.current
    
    if calendar.isDateInToday(sections[section].header) {
      label.text = "Today"
    } else if calendar.isDateInYesterday(sections[section].header) {
      label.text = "Yesterday"
    } else if calendar.isDate(sections[section].header, equalTo: Date(), toGranularity: .month) {
      label.text = "This month"
    } else if calendar.isDate(sections[section].header, equalTo: Date(), toGranularity: .year) {
      let dateFormatter = DateFormatter()
      dateFormatter.dateFormat = "MMMM"
      label.text = dateFormatter.string(from: sections[section].header)
    } else {
      let dateFormatter = DateFormatter()
      dateFormatter.dateFormat = "MMMM yyyy"
      label.text = dateFormatter.string(from: sections[section].header)
    }
    
    label.font = .systemFont(ofSize: 18.0, weight: .semibold)
    view.backgroundColor = .white
    view.addSubview(label)
    
    return view
  }
  
  /// Sets a cell for a row at indexPath based on the active section
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let identifier = "TransactionListViewCell"
    let cell = tableView.dequeueReusableCell(withIdentifier: identifier, for: indexPath) as! TransactionListViewCell
    
    let section = sections[indexPath.section]
    let transaction = section.transactions[indexPath.row]
    
    cell.set(transaction: transaction)
    cell.selectionStyle = .none
    
    return cell;
  }
  
  /// Play the select animation and propogate the event to JS runtime (so onItemPress property can receive a nativeEvent with rowIndex in it)
  func tableView(_ tableView: UITableView, willSelectRowAt indexPath: IndexPath) -> IndexPath? {
    onItemPress(["index": indexPath.row])
    return indexPath
  }
  
  func tableView(_ tableView: UITableView, didHighlightRowAt indexPath: IndexPath) {
    if let cell = tableView.cellForRow(at: indexPath) {
      cell.animateTapStart()
    }
  }
  
  func tableView(_ tableView: UITableView, didUnhighlightRowAt indexPath: IndexPath) {
    if let cell = tableView.cellForRow(at: indexPath) {
      cell.animateTapEnd(duration: duration, options: [], scale: scaleTo)
    }
  }
}
