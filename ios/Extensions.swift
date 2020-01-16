//
//  Extensions.swift
//  Rainbow
//
//  Created by Alexey Kureev on 13/01/2020.
//
extension UIView {
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  func animateQuickTap(duration: TimeInterval = 0.15, options: UIView.AnimationOptions = .curveEaseInOut, scale: CGFloat = 0.97) {
    UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    }, completion: { _ in
      UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
        self.transform = .identity
      })
    })
  }
  
  func animateTapStart(duration: TimeInterval = 0.15, options: UIView.AnimationOptions = .curveEaseInOut, scale: CGFloat = 0.97) {
    UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    })
  }
  
  func animateTapEnd(duration: TimeInterval = 0.15, options: UIView.AnimationOptions = .curveEaseInOut, scale: CGFloat = 0.97) {
    UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
      self.transform = .identity
    })
  }
}
