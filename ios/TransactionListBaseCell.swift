//
//  TransactionListBaseCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 27/01/2020.
//

import Foundation

class TransactionListBaseCell : UITableViewCell {
  internal let hapticType = "select"
  
  var onItemPress: (Dictionary<AnyHashable, Any>) -> Void = { _ in }
  var row: Int? = nil
  var scaleTo: CGFloat = 0.96
  
  func addShadowLayer(_ view: UIView) {
    let shadowLayer = CAShapeLayer()
    let radius = view.frame.width / 2.0
    let circle = UIBezierPath(arcCenter: view.center, radius: radius, startAngle: 0, endAngle: 2 * CGFloat.pi, clockwise: true)
    
    shadowLayer.shadowColor = UIColor.RainbowTheme.Transactions.dark.cgColor
    shadowLayer.shadowOffset = CGSize(width: 0, height: 4)
    // TODO: once we have token color, increase shadowOpacity to 0.3
    shadowLayer.shadowOpacity = 0.15
    shadowLayer.shadowPath = circle.cgPath
    shadowLayer.shadowRadius = 6
    shadowLayer.zPosition = -1
    
    layer.addSublayer(shadowLayer)
  }
  
  func addRequestShadowLayer(_ view: UIView) {
    let shadowLayer = CAShapeLayer()
    let rect = CGRect(x: view.frame.minX, y: view.frame.minY, width: 40, height: 40)
    let roundedRect = UIBezierPath(roundedRect: rect, cornerRadius: 12)
    
    shadowLayer.shadowColor = UIColor.RainbowTheme.Transactions.dark.cgColor
    shadowLayer.shadowOffset = CGSize(width: 0, height: 4)
    shadowLayer.shadowOpacity = 0.15
    shadowLayer.shadowPath = roundedRect.cgPath
    shadowLayer.shadowRadius = 6
    shadowLayer.zPosition = -1
    
    layer.addSublayer(shadowLayer)
  }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart(scale: scaleTo)
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(useHaptic: "selection")
    if row != nil {
      onItemPress(["index":row!])
    }
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd()
  }
  
  func generateTextImage(_ text: String, textColor: UIColor = UIColor.white, backgroundColor: UIColor = UIColor.RainbowTheme.Transactions.blueGreyDark) -> UIImage? {
    let frame = CGRect(x: 0, y: 0, width: 120, height: 120)
    
    var fallbackFontSize = 11 * 3
    if text.count == 0 {
      fallbackFontSize = 0
    } else if text.count > 4 {
      fallbackFontSize = 8 * 3
    } else if text.count == 4 {
      fallbackFontSize = 10 * 3
    } else if (text.count == 1 || text.count == 2) {
      fallbackFontSize = 13 * 3
    }
    let fallbackLetterSpacing = 0.4 * 3
    
    let nameLabel = MyBoundedLabel(frame: frame)
    nameLabel.textAlignment = .center
    nameLabel.backgroundColor = backgroundColor
    nameLabel.textColor = textColor
    nameLabel.font = UIFont(name: "SFRounded-Bold", size: CGFloat(fallbackFontSize))
    nameLabel.text = String(text.prefix(5)).uppercased()
    nameLabel.addCharacterSpacing(kernValue: fallbackLetterSpacing)
    nameLabel.setLineSpacing(lineHeightMultiple: 1.05)
    
    UIGraphicsBeginImageContext(frame.size)
    if let currentContext = UIGraphicsGetCurrentContext() {
      nameLabel.layer.render(in: currentContext)
      return UIGraphicsGetImageFromCurrentImageContext()
    }
    return nil
  }
}
