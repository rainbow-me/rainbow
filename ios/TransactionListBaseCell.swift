//
//  TransactionListBaseCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 27/01/2020.
//

import Foundation

class TransactionListBaseCell : UITableViewCell {
  private let duration = 0.1
  private let scaleTo: CGFloat = 0.97
  private let hapticType = "select"
  
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
}
