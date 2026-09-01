import ActivityKit
import Foundation

/// Shared with the app target: modules/prayer-widget/ios/PrayerActivityAttributes.swift is a
/// byte-identical copy, because an ActivityKit attributes type must compile into both the app
/// that starts the activity and the extension that renders it. Change one, change the other.
struct PrayerActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// The prayer the user is waiting for, or the one that just started when `isNow` is true.
    var prayerLabel: String
    var prayerKind: String
    var prayerAt: Date
    /// Start of the window being counted through, used for the progress bar.
    var windowStart: Date
    /// When the countdown lands: the next prayer after `prayerAt` while `isNow`.
    var windowEnd: Date
    var isNow: Bool
    var nextLabel: String
  }

  var locationName: String
}
