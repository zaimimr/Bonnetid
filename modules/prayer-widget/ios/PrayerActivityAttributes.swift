import ActivityKit
import Foundation

/// Shared with the widget target: targets/widget/PrayerActivityAttributes.swift is an identical
/// copy. ActivityKit requires the same attributes type in the app that starts the activity and
/// the extension that renders it. Change one, change the other.

struct PrayerActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var isoDate: String
    var prayerLabel: String
    var prayerKind: String
    var prayerAt: Date
    var windowEnd: Date
    var showMarkButtons: Bool?
    /// The prayer after this one. Optional so an activity started by an older build still
    /// decodes; nil, or an empty kind, means the view has nothing to fall forward to.
    var nextIsoDate: String?
    var nextLabel: String?
    var nextKind: String?
    var nextAt: Date?
    var nextWindowEnd: Date?
  }

  var locationName: String
}
