import ActivityKit
import AppIntents
import Foundation
import WidgetKit

/// Shared with the app target: modules/prayer-widget/ios/PrayerMarkIntent.swift is an identical
/// copy. A LiveActivityIntent is rendered by the widget extension but performed in the app's
/// process, so the same type has to compile into both binaries. Change one, change the other.

private let prayerLogSuiteName = "group.no.irn.bonnetid"
private let prayerLogDefaultsKey = "prayer_log_v1"

enum PrayerLogStore {
  static func key(_ isoDate: String, _ prayer: String) -> String {
    "\(isoDate)|\(prayer)"
  }

  static func statuses() -> [String: String] {
    var marked: [String: String] = [:]
    for (key, value) in raw() {
      guard let entry = value as? [String: Any], let status = entry["status"] as? String else {
        continue
      }
      marked[key] = status
    }
    return marked
  }

  static func mark(isoDate: String, prayer: String, status: String) {
    guard let defaults = UserDefaults(suiteName: prayerLogSuiteName) else { return }
    var log = raw()
    log[key(isoDate, prayer)] = [
      "status": status,
      "at": Int(Date().timeIntervalSince1970 * 1000),
    ]
    guard
      let data = try? JSONSerialization.data(withJSONObject: log),
      let json = String(data: data, encoding: .utf8)
    else { return }
    defaults.set(json, forKey: prayerLogDefaultsKey)
  }

  private static func raw() -> [String: Any] {
    guard
      let defaults = UserDefaults(suiteName: prayerLogSuiteName),
      let json = defaults.string(forKey: prayerLogDefaultsKey),
      let data = json.data(using: .utf8),
      let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return [:] }
    return parsed
  }
}

@available(iOS 16.2, *)
enum PrayerActivityRegistry {
  static func endAll() async {
    for activity in Activity<PrayerActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}

@available(iOS 17.0, *)
struct MarkPrayerIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Marker bønn"
  static var description = IntentDescription("Marker en bønn som bedt eller hoppet over.")
  static var isDiscoverable: Bool = false
  static var openAppWhenRun: Bool = false

  @Parameter(title: "Dato")
  var isoDate: String

  @Parameter(title: "Bønn")
  var prayer: String

  @Parameter(title: "Status")
  var status: String

  init() {}

  init(isoDate: String, prayer: String, status: String) {
    self.isoDate = isoDate
    self.prayer = prayer
    self.status = status
  }

  func perform() async throws -> some IntentResult {
    PrayerLogStore.mark(isoDate: isoDate, prayer: prayer, status: status)
    await PrayerActivityRegistry.endAll()
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}
