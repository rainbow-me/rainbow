//
//  TransactionListBaseCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 27/01/2020.
//

import Foundation

class TransactionListBaseCell : UITableViewCell {
  internal let duration = 0.1
  internal let scaleTo: CGFloat = 0.97
  internal let hapticType = "select"
  
  var onItemPress: (Dictionary<AnyHashable, Any>) -> Void = { _ in }
  var row: Int? = nil
  
  func addShadowLayer(_ view: UIView) {
    let shadowLayer = CAShapeLayer()
    let radius = view.frame.width / 2.0
    let circle = UIBezierPath(arcCenter: view.center, radius: radius, startAngle: 0, endAngle: 2 * CGFloat.pi, clockwise: true)
    
    shadowLayer.path = circle.cgPath
    shadowLayer.zPosition = -1
    shadowLayer.shadowColor = UIColor.black.cgColor
    shadowLayer.shadowOpacity = 0.3
    shadowLayer.shadowOffset = CGSize(width: 0, height: 3)
    shadowLayer.shadowRadius = 4
    
    layer.addSublayer(shadowLayer)
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart(
      duration: duration,
      scale: scaleTo
    )
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration, useHaptic: "selection")
    if row != nil {
      onItemPress(["index":row!])
    }
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration)
  }
  
  func generateTextImage(_ text: String) -> UIImage? {
    let frame = CGRect(x: 0, y: 0, width: 120, height: 120)
    
    let nameLabel = MyBoundedLabel(frame: frame)
    nameLabel.textAlignment = .center
    nameLabel.backgroundColor = UIColor(red: 0.23, green: 0.24, blue: 0.32, alpha: 1.0)
    nameLabel.textColor = .white
    nameLabel.font = .systemFont(ofSize: 42, weight: .regular)
    nameLabel.text = text
    nameLabel.adjustsFontSizeToFitWidth = true
    
    UIGraphicsBeginImageContext(frame.size)
    if let currentContext = UIGraphicsGetCurrentContext() {
      nameLabel.layer.render(in: currentContext)
      return UIGraphicsGetImageFromCurrentImageContext()
    }
    return nil
  }
}
