import AppIntents
import Foundation
import WidgetKit

let showJamatKey = "widget_show_jamat_v1"

/// Settings that belong to the widget rather than the app: they are toggled on the widget face
/// and live in the shared app group so every widget instance agrees.
enum WidgetPreferences {
  static var showJamat: Bool {
    UserDefaults(suiteName: appGroupIdentifier)?.bool(forKey: showJamatKey) ?? false
  }

  static func setShowJamat(_ value: Bool) {
    UserDefaults(suiteName: appGroupIdentifier)?.set(value, forKey: showJamatKey)
  }
}

/// Runs when the toggle on the widget is tapped: no app launch, no round trip.
struct ToggleJamatIntent: AppIntent {
  static var title: LocalizedStringResource = "Vis jamat-tider"
  static var description = IntentDescription("Slå jamat-tidene i widgeten av eller på.")
  static var isDiscoverable: Bool = false

  func perform() async throws -> some IntentResult {
    WidgetPreferences.setShowJamat(!WidgetPreferences.showJamat)
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}
