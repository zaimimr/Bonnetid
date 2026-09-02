import ActivityKit
import Foundation

/// Shared with the app target: modules/prayer-widget/ios/PrayerActivityAttributes.swift is a
/// byte-identical copy, because an ActivityKit attributes type must compile into both the app
/// that starts the activity and the extension that renders it. Change one, change the other.
struct PrayerActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// The prayer this activity is about; never sunrise.
    var prayerLabel: String
    var prayerKind: String
    var prayerAt: Date
    /// Bounds of the phase on screen: the ten minutes before, or the thirty minutes after.
    var windowStart: Date
    var windowEnd: Date
    /// False while counting down to the prayer, true once it has started.
    var isNow: Bool
  }

  var locationName: String
}
