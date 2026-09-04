import ActivityKit
import Foundation

/// Shared with the app target: modules/prayer-widget/ios/PrayerActivityAttributes.swift is an
/// identical copy. ActivityKit requires the same attributes type in the app that starts the
/// activity and the extension that renders it. Change one, change the other.

struct PrayerActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var isoDate: String
    var prayerLabel: String
    var prayerKind: String
    var prayerAt: Date
    var windowEnd: Date
    var showMarkButtons: Bool?
  }

  var locationName: String
}
