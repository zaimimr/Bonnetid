import SwiftUI
import WidgetKit

@main
struct BonnetidWidgetBundle: WidgetBundle {
  var body: some Widget {
    PrayerWidget()
    PrayerNowWidget()
    PrayerTimelineWidget()
    HijriWidget()
    PrayerLiveActivity()
  }
}
