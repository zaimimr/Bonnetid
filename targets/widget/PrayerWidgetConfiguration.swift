import AppIntents
import WidgetKit

/// The widget's own settings, edited through the system sheet: long press the widget,
/// "Rediger widget", and iOS renders a switch for every parameter here.
struct PrayerWidgetConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Bønnetider"
  static var description = IntentDescription("Velg hva widgeten viser.")

  @Parameter(title: "Vis jamat-tider", description: "Krever at du har valgt en moské i appen.", default: false)
  var showJamat: Bool

  init() {}

  init(showJamat: Bool) {
    self.showJamat = showJamat
  }
}
