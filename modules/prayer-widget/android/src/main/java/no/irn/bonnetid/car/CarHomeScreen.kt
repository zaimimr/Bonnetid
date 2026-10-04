package no.irn.bonnetid.car

import android.Manifest
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import no.irn.bonnetid.widget.PrayerEntry
import no.irn.bonnetid.widget.PrayerFormat
import no.irn.bonnetid.widget.PrayerMoment
import no.irn.bonnetid.widget.PrayerSnapshot

/**
 * The launch screen: which prayer is running now, or the next one before Fajr, with the two
 * places a driver can go from here.
 */
class CarHomeScreen(carContext: CarContext) : Screen(carContext) {
  private var fetching = false
  private var fetchFailed = false
  private var lastAttemptAt = 0L
  private var askedForLocation = false

  init {
    lifecycle.addObserver(CarMinuteTicker { invalidate() })
  }

  override fun onGetTemplate(): Template {
    val snapshot = PrayerSnapshot.load(carContext)
    val now = System.currentTimeMillis()
    requestLocationOnce()

    // Automotive OS has no phone app behind it, so the car fills its own snapshot.
    if (CarDataSource.needsRefresh(snapshot, now) && CarDataSource.configured() && mayRetry(now)) {
      startRefresh(now)
    }
    if (fetching) {
      return MessageTemplate.Builder(LOADING)
        .setTitle(TITLE)
        .setHeaderAction(Action.APP_ICON)
        .build()
    }

    val moment = snapshot?.let { PrayerMoment.resolve(it, now) }
      ?: return MessageTemplate.Builder(if (fetchFailed) OFFLINE else NO_DATA)
        .setTitle(TITLE)
        .setHeaderAction(Action.APP_ICON)
        .build()

    val running = snapshot.currentPrayer(now)
    val headline = running ?: moment.next
    val pane = Pane.Builder()
      .addRow(
        Row.Builder()
          .setTitle("${headline.displayLabel} ${PrayerFormat.time(headline.printedAt(false))}")
          .addText(secondary(moment, running, now))
          .build(),
      )
      .addRow(
        Row.Builder()
          .setTitle(moment.locationName)
          .addText(jamatText(snapshot, headline) ?: moment.hijriText)
          .build(),
      )
      .addAction(
        Action.Builder()
          .setTitle("Moskeer")
          .setOnClickListener { screenManager.push(CarMosqueScreen(carContext)) }
          .build(),
      )
      .addAction(
        Action.Builder()
          .setTitle("Bønnetider")
          .setOnClickListener { screenManager.push(CarPrayerTimesScreen(carContext)) }
          .build(),
      )

    return PaneTemplate.Builder(pane.build())
      .setTitle(TITLE)
      .setHeaderAction(Action.APP_ICON)
      .build()
  }

  private fun mayRetry(now: Long): Boolean =
    !fetchFailed || now - lastAttemptAt >= RETRY_AFTER_MS

  private fun requestLocationOnce() {
    if (askedForLocation || CarPlaces.hasLocationPermission(carContext)) return
    askedForLocation = true
    try {
      carContext.requestPermissions(
        listOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
      ) { granted, _ ->
        if (granted.isNotEmpty() && CarDataSource.configured()) startRefresh(System.currentTimeMillis())
      }
    } catch (error: Exception) {
      invalidate()
    }
  }

  private fun startRefresh(now: Long) {
    if (fetching) return
    fetching = true
    fetchFailed = false
    lastAttemptAt = now
    val appContext = carContext.applicationContext
    val origin = CarPlaces.origin(carContext, PrayerSnapshot.load(carContext))
    Thread {
      val ok = CarDataSource.refresh(appContext, origin)
      carContext.mainExecutor.execute {
        fetching = false
        fetchFailed = !ok
        invalidate()
      }
    }.start()
  }

  private fun secondary(moment: PrayerMoment, running: PrayerEntry?, now: Long): String {
    val countdown = PrayerFormat.countdown(moment.next.at, now)
    if (running == null) return "Starter $countdown"
    return "${moment.next.displayLabel} $countdown"
  }

  private fun jamatText(snapshot: PrayerSnapshot, headline: PrayerEntry): String? {
    if (!snapshot.hasJamatTimes) return null
    val jamat = headline.jamat ?: return null
    val label = if (headline.isJummah) "Jumuah" else "Jamaat"
    val mosque = snapshot.mosqueName ?: return "$label ${PrayerFormat.time(jamat)}"
    return "$label ${PrayerFormat.time(jamat)} · $mosque"
  }

  private companion object {
    const val RETRY_AFTER_MS = 5 * 60 * 1000L
    const val TITLE = "Bønnetid"
    const val NO_DATA = "Åpne Bønnetid på telefonen én gang, så henter bilen bønnetidene herfra."
    const val LOADING = "Henter bønnetider …"
    const val OFFLINE = "Fant ingen bønnetider. Sjekk at bilen har nett og posisjon."
  }
}
