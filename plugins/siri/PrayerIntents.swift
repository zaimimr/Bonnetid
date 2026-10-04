import AppIntents
import SwiftUI

struct NextPrayerIntent: AppIntent {
  static let title: LocalizedStringResource = "Neste bønn"
  static let description = IntentDescription("Hvilken bønn som kommer og hvor lenge det er til.")

  func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
    let now = Date()
    guard
      let snapshot = PrayerSnapshot.load(),
      let moment = PrayerMoment.resolve(from: snapshot, at: now)
    else {
      return .result(dialog: IntentDialog(stringLiteral: SiriText.missing), view: NextPrayerSnippet(moment: nil, now: now))
    }
    return .result(
      dialog: IntentDialog(stringLiteral: SiriText.nextPrayer(moment.next, now: now)),
      view: NextPrayerSnippet(moment: moment, now: now)
    )
  }
}

struct TodayPrayersIntent: AppIntent {
  static let title: LocalizedStringResource = "Dagens bønnetider"
  static let description = IntentDescription("Alle dagens bønnetider for stedet ditt.")

  func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
    let now = Date()
    guard
      let snapshot = PrayerSnapshot.load(),
      snapshot.days.contains(where: { $0.date == PrayerSnapshot.dayKey(for: now) })
    else {
      return .result(dialog: IntentDialog(stringLiteral: SiriText.missing), view: TodayPrayersSnippet(locationName: nil, prayers: []))
    }
    let prayers = snapshot.dailyPrayers(for: now, now: now)
    return .result(
      dialog: IntentDialog(stringLiteral: SiriText.today(prayers)),
      view: TodayPrayersSnippet(locationName: snapshot.locationName, prayers: prayers)
    )
  }
}

struct BonnetidShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: NextPrayerIntent(),
      phrases: [
        "Neste bønn i \(.applicationName)",
        "Når er neste bønn i \(.applicationName)",
        "Hva er neste bønn i \(.applicationName)",
      ],
      shortTitle: "Neste bønn",
      systemImageName: "clock"
    )
    AppShortcut(
      intent: TodayPrayersIntent(),
      phrases: [
        "Dagens bønnetider i \(.applicationName)",
        "Bønnetider i dag i \(.applicationName)",
        "Vis bønnetidene i \(.applicationName)",
      ],
      shortTitle: "Dagens bønnetider",
      systemImageName: "list.bullet"
    )
  }
}

enum SiriText {
  static let missing = "Åpne Bønnetid først, så henter appen bønnetidene for stedet ditt."

  static func nextPrayer(_ prayer: PrayerEntry, now: Date) -> String {
    var text = "Neste bønn er \(prayer.printedLabel) klokken \(PrayerFormat.time(prayer.at)), \(spokenCountdown(to: prayer.at, from: now))"
    if let jamat = prayer.jamat {
      text += ", jamat \(PrayerFormat.time(jamat))"
    }
    return text + "."
  }

  static func today(_ prayers: [PrayerEntry]) -> String {
    let parts = prayers.map { "\($0.printedLabel) \(PrayerFormat.time($0.at))" }
    guard let last = parts.last else { return missing }
    return parts.count > 1 ? parts.dropLast().joined(separator: ", ") + " og \(last)." : "\(last)."
  }

  static func spokenCountdown(to date: Date, from now: Date) -> String {
    let minutesTotal = max(0, Int(date.timeIntervalSince(now)) / 60)
    let hours = minutesTotal / 60
    let minutes = minutesTotal % 60
    let hourText = hours == 1 ? "1 time" : "\(hours) timer"
    let minuteText = minutes == 1 ? "1 minutt" : "\(minutes) minutter"
    switch (hours, minutes) {
    case (0, 0): return "om under ett minutt"
    case (0, _): return "om \(minuteText)"
    case (_, 0): return "om \(hourText)"
    default: return "om \(hourText) og \(minuteText)"
    }
  }
}

struct NextPrayerSnippet: View {
  let moment: PrayerMoment?
  let now: Date

  var body: some View {
    if let moment {
      let next = moment.next
      HStack(alignment: .center, spacing: 12) {
        Image(systemName: PrayerFormat.symbol(for: next.kind))
          .font(.title2)
          .foregroundStyle(PrayerColor.brand)
        VStack(alignment: .leading, spacing: 2) {
          Text(next.printedLabel)
            .font(.headline)
            .foregroundStyle(PrayerColor.brand)
          Text(PrayerFormat.countdown(to: next.at, from: now))
            .font(.subheadline)
            .foregroundStyle(PrayerColor.inkSecondary)
        }
        Spacer(minLength: 8)
        VStack(alignment: .trailing, spacing: 2) {
          Text(PrayerFormat.time(next.at))
            .prayerTime(.system(.title, design: .default).weight(.bold))
            .foregroundStyle(PrayerColor.ink)
          if let jamat = next.jamat {
            Text("Jamat \(PrayerFormat.time(jamat))")
              .prayerTime(.subheadline)
              .foregroundStyle(PrayerColor.brand)
          }
        }
      }
      .padding()
    } else {
      MissingSnippet()
    }
  }
}

struct TodayPrayersSnippet: View {
  let locationName: String?
  let prayers: [PrayerEntry]

  private var hasJamat: Bool { prayers.contains { $0.jamat != nil } }

  var body: some View {
    if let locationName, !prayers.isEmpty {
      VStack(alignment: .leading, spacing: 8) {
        Text(locationName)
          .font(.caption)
          .foregroundStyle(PrayerColor.inkSecondary)
        ForEach(prayers, id: \.at) { prayer in
          HStack(spacing: 10) {
            Image(systemName: PrayerFormat.symbol(for: prayer.kind))
              .font(.subheadline)
              .foregroundStyle(PrayerColor.brand)
              .frame(width: 22)
            Text(prayer.printedLabel)
              .font(.body)
              .foregroundStyle(PrayerColor.ink)
            Spacer(minLength: 8)
            Text(PrayerFormat.time(prayer.at))
              .prayerTime(.body.weight(.semibold))
              .foregroundStyle(PrayerColor.ink)
            if hasJamat {
              Text(prayer.jamat.map(PrayerFormat.time) ?? "")
                .prayerTime(.subheadline)
                .foregroundStyle(PrayerColor.brand)
                .frame(minWidth: 44, alignment: .trailing)
            }
          }
        }
      }
      .padding()
    } else {
      MissingSnippet()
    }
  }
}

private struct MissingSnippet: View {
  var body: some View {
    Label("Åpne Bønnetid for å hente tidene", systemImage: "moon.stars")
      .font(.subheadline)
      .foregroundStyle(PrayerColor.inkSecondary)
      .padding()
  }
}
