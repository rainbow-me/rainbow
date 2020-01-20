//
//  Extensions.swift
//  Rainbow
//
//  Created by Alexey Kureev on 13/01/2020.
//

fileprivate func generateHapticFeedback(_ hapticEffect: String) {
  switch hapticEffect {
  case "error":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.error)
    
  case "success":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.success)
    
  case "warning":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.warning)
    
  case "light":
      let generator = UIImpactFeedbackGenerator(style: .light)
      generator.impactOccurred()

  case "medium":
      let generator = UIImpactFeedbackGenerator(style: .medium)
      generator.impactOccurred()

  case "heavy":
      let generator = UIImpactFeedbackGenerator(style: .heavy)
      generator.impactOccurred()
  default:
    let generator = UISelectionFeedbackGenerator()
    generator.selectionChanged()
  }
}

extension UIView {
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  func animateQuickTap(
    duration: TimeInterval = 0.15,
    options: UIView.AnimationOptions = .curveEaseInOut,
    scale: CGFloat = 0.97
  ) {
    UIView.animate(withDuration: duration, delay: 0, options: [options, .autoreverse], animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    })
  }
  
  func animateTapStart(
    duration: TimeInterval = 0.15,
    options: UIView.AnimationOptions = .curveEaseInOut,
    scale: CGFloat = 0.97,
    useHaptic: String? = nil
  ) {
    if useHaptic != nil {
      generateHapticFeedback(useHaptic!)
    }
    UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    })
  }
  
  func animateTapEnd(duration: TimeInterval = 0.15, options: UIView.AnimationOptions = .curveEaseInOut, scale: CGFloat = 0.97) {
    UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.3, initialSpringVelocity: 10.0, options: options, animations: {
      self.transform = .identity
    })
  }
}
