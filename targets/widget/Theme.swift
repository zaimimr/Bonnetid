import SwiftUI

/// Mirrors src/theme/theme.ts. Both appearances are defined explicitly, the way the app's
/// semantic roles are: emerald is the only tint, everything else is ink on a calm surface.
enum PrayerColor {
  static let brand = dynamic(light: 0x0C6B52, dark: 0x6FBA9D)
  static let brandPlate = dynamic(light: 0xD3EAE0, dark: 0x27362F)
  static let onBrandPlate = dynamic(light: 0x074536, dark: 0xD3EAE0)
  static let surface = dynamic(light: 0xFFFFFF, dark: 0x151F1B)
  static let ink = dynamic(light: 0x182420, dark: 0xF6F8F7)
  static let inkSecondary = dynamic(light: 0x3E4C46, dark: 0xC6D0CB)
  static let inkMuted = dynamic(light: 0x5F6E67, dark: 0x8C9A93)
  static let hairline = dynamic(light: 0xDDE4E0, dark: 0x27362F)
  static let track = dynamic(light: 0xEDF1EF, dark: 0x27362F)
  static let trackMarker = dynamic(light: 0xC3CEC8, dark: 0x354740)

  private static func dynamic(light: UInt32, dark: UInt32) -> Color {
    Color(UIColor { traits in
      traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
    })
  }
}

private extension UIColor {
  convenience init(hex: UInt32) {
    self.init(
      red: CGFloat((hex >> 16) & 0xFF) / 255,
      green: CGFloat((hex >> 8) & 0xFF) / 255,
      blue: CGFloat(hex & 0xFF) / 255,
      alpha: 1
    )
  }
}

extension View {
  /// Times always render with tabular figures, as in the app.
  func prayerTime(_ font: Font) -> some View {
    self.font(font).monospacedDigit()
  }
}
