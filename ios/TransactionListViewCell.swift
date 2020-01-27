//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import UIKit

class MyBoundedLabel: UILabel {
  override func drawText(in rect: CGRect) {
    super.drawText(in: rect.insetBy(dx: 2.0, dy: 2.0))
  }
}

class TransactionListViewCell: UITableViewCell {
  
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var transactionIcon: UIImageView!
  @IBOutlet weak var coinName: UILabel!
  @IBOutlet weak var balanceDisplay: UILabel!
  @IBOutlet weak var nativeDisplay: UILabel!
  @IBOutlet weak var coinImage: UIImageView!
  
  private let duration = 0.1
  private let scaleTo: CGFloat = 0.97
  private let hapticType = "select"
  
  var onItemPress: (Dictionary<AnyHashable, Any>) -> Void = { _ in }
  var row: Int? = nil
  
  override func awakeFromNib() {
    super.awakeFromNib()
    
    addShadowLayer()
  }
  
  func set(transaction: Transaction) {
    transactionType.text = transaction.status
    coinName.text = transaction.coinName
    nativeDisplay.text = transaction.nativeDisplay
    balanceDisplay.text = transaction.balanceDisplay
    
    if let image = UIImage.init(named: transaction.status.lowercased()) {
      transactionIcon.image = image
      transactionIcon.tintAdjustmentMode = .normal
    }
    
    setStatusColor(transaction)
    setCellColors(transaction)
    
    if transaction.symbol != nil {
      if let img = UIImage.init(named: transaction.symbol.lowercased()) {
        coinImage.image = img
      } else {
        coinImage.image = generateTextImage(transaction.symbol)
        coinImage.layer.cornerRadius = coinImage.frame.width * 0.5
      }
    }
  }
  
  private func addShadowLayer() {
    let shadowLayer = CAShapeLayer()
    let radius: CGFloat = 20.0
    let circle = UIBezierPath(arcCenter: coinImage.center, radius: radius, startAngle: 0, endAngle: 2 * CGFloat.pi, clockwise: true)
    
    shadowLayer.path = circle.cgPath
    shadowLayer.zPosition = -1
    shadowLayer.shadowColor = UIColor.black.cgColor
    shadowLayer.shadowOpacity = 0.3
    shadowLayer.shadowOffset = CGSize(width: 0, height: 3)
    shadowLayer.shadowRadius = 3
    
    layer.addSublayer(shadowLayer)
  }
  
  private func setStatusColor(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var color = transactionColors.blueGreyMediumLight
    
    if transaction.pending {
      color = transactionColors.primaryBlue
    } else if transaction.type == "trade" {
      if transaction.status.lowercased() == "received" {
        color = transactionColors.dodgerBlue
      } else if transaction.status.lowercased() == "sent" {
        color = transactionColors.dodgerBlue
        transactionIcon.image = UIImage.init(named: "swapped")
        transactionType.text = "Swapped"
      }
    }
    
    transactionIcon.tintColor = color
    transactionType.textColor = color
  }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart(
      duration: duration,
      options: .curveEaseOut,
      scale: scaleTo,
      useHaptic: hapticType
    )
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration, options: .curveEaseOut, scale: scaleTo)
    if row != nil {
      onItemPress(["index":row!])
    }
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration, options: .curveEaseOut, scale: scaleTo)
  }
  
  private func setCellColors(_ transaction: Transaction) {
    coinName.alpha = 1.0
    nativeDisplay.alpha = 1.0
    
    if transaction.type == "trade" {
      if transaction.status.lowercased() == "sent" {
        coinName.alpha = 0.5
        nativeDisplay.alpha = 0.5
      }
    }
    
    switch transaction.status {
    case "Sent":
      nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
      break
    case "Received":
      nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.limeGreen
      break
    default:
      break
    }
  }
}
