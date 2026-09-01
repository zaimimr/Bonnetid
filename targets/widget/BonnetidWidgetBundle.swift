import SwiftUI
import WidgetKit

@main
struct BonnetidWidgetBundle: WidgetBundle {
  var body: some Widget {
    PrayerWidget()
    PrayerLiveActivity()
  }
}
