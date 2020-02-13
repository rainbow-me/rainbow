//
//  TransactionListView.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import Foundation

class TransactionListView: UIView, UITableViewDelegate {
  @objc var onTransactionPress: RCTBubblingEventBlock = { _ in }
  @objc var onRequestPress: RCTBubblingEventBlock = { _ in }
  @objc var onRequestExpire: RCTBubblingEventBlock = { _ in }
  @objc var onReceivePress: RCTBubblingEventBlock = { _ in }
  @objc var onCopyAddressPress: RCTBubblingEventBlock = { _ in }
  @objc var onAvatarPress: RCTBubblingEventBlock = { _ in }
  @objc var duration: TimeInterval = 0.15
  @objc var isAvatarPickerAvailable: Bool = true {
    didSet {
      header.avatarView.isHidden = isAvatarPickerAvailable
      header.accountView.isHidden = !isAvatarPickerAvailable
    }
  }
  @objc var scaleTo: CGFloat = 0.97
  @objc var enableHapticFeedback: Bool = true
  @objc var hapticType: String = "selection"
  @objc var accountAddress: String? = nil {
    didSet {
      header.accountAddress.text = accountAddress
    }
  }
  @objc var accountColor: UIColor? = nil {
    didSet {
      header.accountView.backgroundColor = accountColor
    }
  }
  @objc var accountName: String? = nil {
    didSet {
      header.accountName.text = accountName
    }
  }
  @objc var data: TransactionData = TransactionData() {
    didSet {
      viewModel = TransactionViewModel(data: data)
      viewModel!.onRequestPress = onRequestPress
      viewModel!.onTransactionPress = onTransactionPress
      viewModel!.onRequestExpire = onRequestExpire
      tableView.dataSource = viewModel
      tableView.reloadData()
    }
  }
  @objc func onAvatarPressed(_ sender: UIButton) {
    self.onAvatarPress([:])
  }
  
  @objc func onPressInAvatar(_ sender: UIButton) {
    header.accountView.animateTapStart(scale: 0.89)
  }

  @objc func onPressOutAvatar(_ sender: UIButton) {
    header.accountView.animateTapStart(scale: 1.0)
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
  
  var viewModel: TransactionViewModel?
  
  let tableView = UITableView()
  let header: TransactionListViewHeader = TransactionListViewHeader.fromNib()
  let headerSeparator = UIView()
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    
    tableView.dataSource = viewModel
    tableView.delegate = self
    tableView.rowHeight = 60
    tableView.delaysContentTouches = false
    tableView.separatorStyle = .none
    tableView.register(UINib(nibName: "TransactionListViewCell", bundle: nil), forCellReuseIdentifier: "TransactionListViewCell")
    tableView.register(UINib(nibName: "TransactionListRequestViewCell", bundle: nil), forCellReuseIdentifier: "TransactionListRequestViewCell")
    
    header.addSubview(headerSeparator)
    
    header.accountView.addTarget(self, action: #selector(onAvatarPressed(_:)), for: .touchUpInside)
    header.accountView.addTarget(self, action: #selector(onPressInAvatar(_:)), for: .touchDown)
    header.accountView.addTarget(self, action: #selector(onPressInAvatar(_:)), for: .touchDragInside)
    header.accountView.addTarget(self, action: #selector(onPressOutAvatar(_:)), for: .touchUpInside)
    header.accountView.addTarget(self, action: #selector(onPressOutAvatar(_:)), for: .touchDragOutside)
    header.accountView.addTarget(self, action: #selector(onPressOutAvatar(_:)), for: .touchCancel)
    header.accountView.addTarget(self, action: #selector(onPressOutAvatar(_:)), for: .touchUpOutside)
    
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
  
  func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
    return 60
  }
  
  func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
    let view = UIView(frame: CGRect(x: 0, y: 0, width: frame.width, height: 40))
    let label = UILabel(frame: CGRect(x: 20, y: 20, width: view.frame.width, height: view.frame.height))
    
    if viewModel?.sections.count == 0 {
      return nil
    }
    
    let section = viewModel!.sections[section]
    
    label.text = section.title
    label.font = .systemFont(ofSize: 18.0, weight: .semibold)
    view.backgroundColor = .white
    view.addSubview(label)
    
    return view
  }
}
