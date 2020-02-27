//
//  CoinIconWithProgressBar.swift
//  Rainbow
//
//  Created by Alexey Kureev on 06/02/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

import Foundation

class CoinIconWithProgressBar : UIImageView {
  private let shape = CAShapeLayer()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup();
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup();
  }
  
  func changeProgress(_ progress: CGFloat) -> Void {
    UIView.animate(withDuration: 200, animations: {
      self.shape.strokeEnd = progress
    })
  }
  
  private func setup() {
    let shapeView = UIView()
    let lineWidth: CGFloat = 2.0
    let circularPath = UIBezierPath(
      arcCenter: CGPoint(x: bounds.midX, y: bounds.midY),
      radius: frame.width / 2.0,
      startAngle: -CGFloat.pi / 2,
      endAngle: 2 * CGFloat.pi - CGFloat.pi / 2,
      clockwise: true
    )
    shape.path = circularPath.cgPath
    shape.strokeColor = UIColor.RainbowTheme.Transactions.primaryBlue.cgColor
    shape.lineWidth = lineWidth
    shape.lineCap = .round
    shape.fillColor = .none
    shape.strokeStart = 0.0
    shapeView.layer.insertSublayer(shape, at: 0)
    clipsToBounds = false
    insertSubview(shapeView, at: 0)
  }
}
