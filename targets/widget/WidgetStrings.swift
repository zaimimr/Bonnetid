import Foundation
import SwiftUI

enum WidgetLanguage: String {
  case nb, en, ar, ur
}

struct WidgetStrings {
  let language: WidgetLanguage

  static var current: WidgetStrings {
    let raw = UserDefaults(suiteName: appGroupIdentifier)?.string(forKey: snapshotKey) ?? ""
    return WidgetStrings(language: storedLanguage(in: raw))
  }

  private static func storedLanguage(in raw: String) -> WidgetLanguage {
    guard let range = raw.range(of: "\"lang\":\"") else { return .nb }
    let code = raw[range.upperBound...].prefix { $0 != "\"" }
    return WidgetLanguage(rawValue: String(code)) ?? .nb
  }

  private func pick(_ nb: String, _ en: String, _ ar: String, _ ur: String) -> String {
    switch language {
    case .nb: return nb
    case .en: return en
    case .ar: return ar
    case .ur: return ur
    }
  }

  var isRTL: Bool { language == .ar || language == .ur }
  var layoutDirection: LayoutDirection { isRTL ? .rightToLeft : .leftToRight }
  var locale: Locale {
    Locale(identifier: pick("nb_NO", "en_GB", "ar@numbers=latn", "ur_PK@numbers=latn"))
  }

  var next: String { pick("Neste", "Next", "التالية", "اگلی") }
  var now: String { pick("Nå", "Now", "الآن", "ابھی") }
  func stateLabel(isNow: Bool) -> String { isNow ? now : next }
  func nowLine(_ label: String) -> String {
    pick("\(label) nå", "\(label) now", "\(label) الآن", "\(label) ابھی")
  }
  func nextLine(_ value: String) -> String {
    pick("Neste: \(value)", "Next: \(value)", "التالية: \(value)", "اگلی: \(value)")
  }
  var currentPrayer: String { pick("Nåværende bønn", "Current prayer", "الصلاة الحالية", "موجودہ نماز") }
  var nextPrayer: String { pick("Neste bønn", "Next prayer", "الصلاة التالية", "اگلی نماز") }
  var timeUntilNext: String {
    pick("Tid igjen til neste salah", "Time until next prayer", "الوقت المتبقي للصلاة التالية", "اگلی نماز میں باقی وقت")
  }
  var jamat: String { pick("jamat", "jamaat", "جماعة", "جماعت") }

  var appName: String { "Bønnetid" }
  var openApp: String { pick("Åpne Bønnetid", "Open Bønnetid", "افتح Bønnetid", "Bønnetid کھولیں") }
  var openAppForTimes: String {
    pick("Åpne appen for tider", "Open the app for times", "افتح التطبيق لعرض المواقيت", "اوقات کے لیے ایپ کھولیں")
  }
  var timesAppearHere: String {
    pick(
      "Tidene vises her så snart appen har hentet dem for stedet ditt.",
      "The times appear here once the app has fetched them for your location.",
      "ستظهر المواقيت هنا بعد أن يجلبها التطبيق لموقعك.",
      "ایپ کے آپ کے مقام کے اوقات حاصل کرنے کے بعد وہ یہاں نظر آئیں گے۔"
    )
  }
  var timelineAppearsHere: String {
    pick(
      "Tidslinjen vises her så snart appen har hentet tidene for stedet ditt.",
      "The timeline appears here once the app has fetched the times for your location.",
      "سيظهر الخط الزمني هنا بعد أن يجلب التطبيق المواقيت لموقعك.",
      "ایپ کے آپ کے مقام کے اوقات حاصل کرنے کے بعد ٹائم لائن یہاں نظر آئے گی۔"
    )
  }

  var prayerWidgetName: String { pick("Bønnetider", "Prayer times", "مواقيت الصلاة", "نماز کے اوقات") }
  var prayerWidgetDescription: String {
    pick(
      "Neste bønn og dagens tider for stedet ditt.",
      "The next prayer and today's times for your location.",
      "الصلاة التالية ومواقيت اليوم لموقعك.",
      "آپ کے مقام کے لیے اگلی نماز اور آج کے اوقات۔"
    )
  }
  var timelineWidgetName: String { pick("Tidslinje", "Timeline", "الخط الزمني", "ٹائم لائن") }
  var timelineWidgetDescription: String {
    pick(
      "Døgnet fra 00:00 til 24:00 med bønnene og tiden igjen til den neste.",
      "The day from 00:00 to 24:00 with the prayers and the time left until the next one.",
      "اليوم من 00:00 إلى 24:00 مع الصلوات والوقت المتبقي للصلاة التالية.",
      "00:00 سے 24:00 تک کا دن، نمازوں اور اگلی نماز تک باقی وقت کے ساتھ۔"
    )
  }

  func windowOver(_ label: String) -> String {
    pick("\(label)-tiden er over", "\(label) time is over", "انتهى وقت \(label)", "\(label) کا وقت ختم ہو گیا")
  }
  var endsIn: String { pick("Går ut om", "Ends in", "ينتهي بعد", "باقی وقت") }
  var unmarked: String { pick("Ubesvart", "Not marked", "غير مسجّلة", "درج نہیں") }
  var prayed: String { pick("Bedt", "Prayed", "صلّيت", "ادا کی") }
  var skip: String { pick("Hopp over", "Skip", "تخطي", "چھوڑیں") }

  func countdown(to date: Date, from now: Date = Date()) -> String {
    let seconds = max(0, Int(date.timeIntervalSince(now)))
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    if hours > 0 {
      return pick(
        "om \(hours)t \(minutes)m",
        "in \(hours)h \(minutes)m",
        "بعد \(hours) س \(minutes) د",
        "\(hours) گھنٹے \(minutes) منٹ میں"
      )
    }
    if minutes > 0 {
      return pick("om \(minutes) min", "in \(minutes) min", "بعد \(minutes) د", "\(minutes) منٹ میں")
    }
    return pick("om under 1 min", "in under 1 min", "بعد أقل من دقيقة", "ایک منٹ سے کم میں")
  }
}

extension View {
  func widgetLanguage(_ strings: WidgetStrings) -> some View {
    environment(\.layoutDirection, strings.layoutDirection)
      .environment(\.locale, strings.locale)
  }
}
