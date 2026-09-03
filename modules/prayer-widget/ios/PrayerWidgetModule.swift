import ActivityKit
import ExpoModulesCore
import WidgetKit

private let appGroupIdentifier = "group.no.irn.bonnetid"
private let snapshotKey = "prayer_snapshot_v1"
private let prayerLogKey = "prayer_log_v1"

struct PrayerActivityState: Record {
  @Field var locationName: String = ""
  @Field var prayerLabel: String = ""
  @Field var prayerKind: String = ""
  /// Epoch seconds, so no date coercion happens across the bridge.
  @Field var prayerAt: Double = 0
  @Field var windowStart: Double = 0
  @Field var windowEnd: Double = 0
  @Field var isNow: Bool = false
  /// When the activity should be gone from the screen.
  @Field var dismissAt: Double = 0
}

@available(iOS 16.2, *)
private enum ActivityStore {
  static var current: Activity<PrayerActivityAttributes>?
}

public class PrayerWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerWidget")

    Function("setSnapshot") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
        throw AppGroupUnavailableException()
      }
      defaults.set(json, forKey: snapshotKey)
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("getPrayerLog") { () -> String? in
      UserDefaults(suiteName: appGroupIdentifier)?.string(forKey: prayerLogKey)
    }

    Function("setPrayerLog") { (json: String) in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
        throw AppGroupUnavailableException()
      }
      defaults.set(json, forKey: prayerLogKey)
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("areLiveActivitiesEnabled") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startOrUpdateActivity") { (state: PrayerActivityState) in
      guard #available(iOS 16.2, *) else {
        throw LiveActivityUnsupportedException()
      }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        throw LiveActivityDisabledException()
      }

      let dismissAt = Date(timeIntervalSince1970: state.dismissAt)
      let content = ActivityContent(
        state: state.toContentState(),
        staleDate: dismissAt,
        relevanceScore: state.isNow ? 100 : 50
      )

      let activity: Activity<PrayerActivityAttributes>
      if let existing = ActivityStore.current ?? Self.adoptRunningActivity() {
        await existing.update(content)
        activity = existing
      } else {
        activity = try Activity.request(
          attributes: PrayerActivityAttributes(locationName: state.locationName),
          content: content,
          pushType: nil
        )
      }
      ActivityStore.current = activity

      // Once the prayer has started nothing more needs to change, so hand ActivityKit the
      // removal time: the activity leaves the screen on its own, with the app closed.
      if state.isNow {
        await activity.end(content, dismissalPolicy: .after(dismissAt))
        ActivityStore.current = nil
      }
    }

    AsyncFunction("endActivity") {
      guard #available(iOS 16.2, *) else { return }
      let activity = ActivityStore.current ?? Self.adoptRunningActivity()
      await activity?.end(nil, dismissalPolicy: .immediate)
      ActivityStore.current = nil
    }
  }

  /// After a cold start the app has no handle on an activity it started last launch, but
  /// ActivityKit still lists it, so pick it up instead of stacking a second one.
  @available(iOS 16.2, *)
  private static func adoptRunningActivity() -> Activity<PrayerActivityAttributes>? {
    Activity<PrayerActivityAttributes>.activities.first
  }
}

private extension PrayerActivityState {
  func toContentState() -> PrayerActivityAttributes.ContentState {
    PrayerActivityAttributes.ContentState(
      prayerLabel: prayerLabel,
      prayerKind: prayerKind,
      prayerAt: Date(timeIntervalSince1970: prayerAt),
      windowStart: Date(timeIntervalSince1970: windowStart),
      windowEnd: Date(timeIntervalSince1970: windowEnd),
      isNow: isNow
    )
  }
}

internal final class AppGroupUnavailableException: Exception {
  override var reason: String {
    "App group \(appGroupIdentifier) is not available to this build."
  }
}

internal final class LiveActivityUnsupportedException: Exception {
  override var reason: String {
    "Live Activities require iOS 16.2 or newer."
  }
}

internal final class LiveActivityDisabledException: Exception {
  override var reason: String {
    "Live Activities are turned off for this app in Settings."
  }
}
