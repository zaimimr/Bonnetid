import CarPlay
import CoreLocation

@objc(BonnetidCarPlaySceneDelegate)
final class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate, CLLocationManagerDelegate {
  private var scene: CPTemplateApplicationScene?
  private var interfaceController: CPInterfaceController?
  private var timer: Timer?
  private var mosqueRows: [String] = []
  private let locationManager = CLLocationManager()

  private let prayersTemplate: CPListTemplate = {
    let template = CPListTemplate(title: "Neste bønn", sections: [])
    template.tabTitle = "Neste bønn"
    template.tabImage = UIImage(systemName: "clock")
    template.emptyViewTitleVariants = [CarPlayText.missing]
    return template
  }()

  private let mosquesTemplate: CPListTemplate = {
    let template = CPListTemplate(title: "Moskeer", sections: [])
    template.tabTitle = "Moskeer"
    template.tabImage = UIImage(systemName: "mappin.and.ellipse")
    template.emptyViewTitleVariants = [CarPlayText.noMosques]
    return template
  }()

  func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didConnect interfaceController: CPInterfaceController
  ) {
    scene = templateApplicationScene
    self.interfaceController = interfaceController
    locationManager.delegate = self
    interfaceController.setRootTemplate(
      CPTabBarTemplate(templates: [prayersTemplate, mosquesTemplate]),
      animated: false,
      completion: nil
    )
    refresh()
    let nextMinute = Calendar.current.nextDate(
      after: Date(),
      matching: DateComponents(second: 0),
      matchingPolicy: .nextTime
    ) ?? Date().addingTimeInterval(60)
    let timer = Timer(fire: nextMinute, interval: 60, repeats: true) { [weak self] _ in
      self?.refresh()
    }
    RunLoop.main.add(timer, forMode: .common)
    self.timer = timer
  }

  func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didDisconnectInterfaceController interfaceController: CPInterfaceController
  ) {
    timer?.invalidate()
    timer = nil
    locationManager.delegate = nil
    self.interfaceController = nil
    scene = nil
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let snapshot = PrayerSnapshot.load() else { return }
    updateMosques(snapshot, now: Date())
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

  private var hasLocationPermission: Bool {
    switch locationManager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways: return true
    default: return false
    }
  }

  private var maxRows: Int { min(CPListTemplate.maximumItemCount, 12) }

  private func refresh() {
    let now = Date()
    guard let snapshot = PrayerSnapshot.load() else {
      prayersTemplate.updateSections([])
      mosquesTemplate.updateSections([])
      mosqueRows = []
      return
    }
    updatePrayers(snapshot, now: now)
    updateMosques(snapshot, now: now)
    if hasLocationPermission { locationManager.requestLocation() }
  }

  private func updatePrayers(_ snapshot: PrayerSnapshot, now: Date) {
    guard let moment = PrayerMoment.resolve(from: snapshot, at: now) else {
      prayersTemplate.updateSections([])
      return
    }
    let next = moment.next
    let nextItem = CPListItem(
      text: "\(next.printedLabel) \(PrayerFormat.time(next.at))",
      detailText: [PrayerFormat.countdown(to: next.at, from: now), CarPlayText.jamat(next)]
        .compactMap { $0 }
        .joined(separator: " · ")
    )
    let current = snapshot.currentPrayer(at: now)
    let today = snapshot.dailyPrayers(for: now, now: now).map { prayer in
      let detail = [prayer.at == current?.at ? "Nå" : nil, CarPlayText.jamat(prayer)].compactMap { $0 }
      return CPListItem(
        text: "\(prayer.printedLabel) \(PrayerFormat.time(prayer.at))",
        detailText: detail.isEmpty ? nil : detail.joined(separator: " · ")
      )
    }
    prayersTemplate.updateSections([
      CPListSection(items: [nextItem], header: "Neste bønn", sectionIndexTitle: nil),
      CPListSection(items: today, header: "I dag · \(snapshot.locationName)", sectionIndexTitle: nil),
    ])
  }

  private func updateMosques(_ snapshot: PrayerSnapshot, now: Date) {
    let here = hasLocationPermission ? locationManager.location : nil
    let origin = here ?? snapshot.origin.map { CLLocation(latitude: $0.lat, longitude: $0.lon) }
    let ranked = (snapshot.mosques ?? [])
      .map { mosque in
        (mosque, origin?.distance(from: CLLocation(latitude: mosque.lat, longitude: mosque.lon)))
      }
      .sorted { ($0.1 ?? 0) < ($1.1 ?? 0) }
      .prefix(maxRows)
    let nextJamat = snapshot.allPrayers(at: now).first { $0.isPrayer && ($0.jamat ?? .distantPast) > now }
    let rows = ranked.map { mosque, meters in
      let jamat = mosque.name == snapshot.mosqueName ? nextJamat.flatMap(CarPlayText.nextJamat) : nil
      return (mosque, [meters.map(CarPlayText.distance), jamat].compactMap { $0 }.joined(separator: " · "))
    }
    let key = rows.map { "\($0.0.orgNr)|\($0.1)" }
    guard key != mosqueRows else { return }
    mosqueRows = key
    let items = rows.map { mosque, detail in
      let item = CPListItem(text: mosque.name, detailText: detail.isEmpty ? nil : detail)
      item.handler = { [weak self] _, completion in
        self?.navigate(to: mosque)
        completion()
      }
      return item
    }
    mosquesTemplate.updateSections([CPListSection(items: items)])
  }

  private func navigate(to mosque: SnapshotMosque) {
    guard let url = URL(string: "maps://?daddr=\(mosque.lat),\(mosque.lon)&dirflg=d") else { return }
    scene?.open(url, options: nil, completionHandler: nil)
  }
}

enum CarPlayText {
  static let missing = "Åpne Bønnetid på telefonen først."
  static let noMosques = "Åpne Bønnetid på telefonen for å hente moskeene."

  private static let distanceFormatter: MeasurementFormatter = {
    let formatter = MeasurementFormatter()
    formatter.locale = Locale(identifier: "nb_NO")
    formatter.unitOptions = .naturalScale
    formatter.numberFormatter.maximumFractionDigits = 1
    return formatter
  }()

  static func distance(_ meters: CLLocationDistance) -> String {
    distanceFormatter.string(from: Measurement(value: meters.rounded(), unit: UnitLength.meters))
  }

  static func jamat(_ prayer: PrayerEntry) -> String? {
    prayer.jamat.map { "\(prayer.isJummah == true ? "Jumuah" : "Jamat") \(PrayerFormat.time($0))" }
  }

  static func nextJamat(_ prayer: PrayerEntry) -> String? {
    guard let jamat = prayer.jamat else { return nil }
    if prayer.isJummah == true { return "Jumuah \(PrayerFormat.time(jamat))" }
    return "Jamat \(prayer.printedLabel) \(PrayerFormat.time(jamat))"
  }
}
