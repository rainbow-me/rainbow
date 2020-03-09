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
  
  func animateTapStart(
    duration: TimeInterval = 0.1,
    scale: CGFloat = 0.97
  ) {
    let timingFunction = CAMediaTimingFunction(controlPoints: 0.25, 0.46, 0.45, 0.94)
    
    CATransaction.begin()
    CATransaction.setAnimationTimingFunction(timingFunction)
    
    UIView.animate(withDuration: duration) {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    }
    
    CATransaction.commit()
  }
  
  func animateTapEnd(duration: TimeInterval = 0.1, useHaptic: String? = nil) {
    if useHaptic != nil {
      generateHapticFeedback(useHaptic!)
    }
    let timingFunction = CAMediaTimingFunction(controlPoints: 0.25, 0.46, 0.45, 0.94)
    
    CATransaction.begin()
    CATransaction.setAnimationTimingFunction(timingFunction)
    
    UIView.animate(withDuration: duration) {
      self.transform = .identity
    }
    
    CATransaction.commit()
  }
}

extension Date {
  func days(from date: Date) -> Int {
    return Calendar.current.dateComponents([.day], from: date, to: self).day ?? 0
  }
  
  func hours(from date: Date) -> Int {
    return Calendar.current.dateComponents([.hour], from: date, to: self).hour ?? 0
  }
  
  func minutes(from date: Date) -> Int {
    return Calendar.current.dateComponents([.minute], from: date, to: self).minute ?? 0
  }
  
  func seconds(from date: Date) -> Int {
    return Calendar.current.dateComponents([.second], from: date, to: self).second ?? 0
  }
}
