package no.irn.bonnetid.car

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ItemList
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import no.irn.bonnetid.widget.PrayerEntry
import no.irn.bonnetid.widget.PrayerFormat
import no.irn.bonnetid.widget.PrayerSnapshot

/** Today's five prayers. The driving row limit is six, so the day fits without paging. */
class CarPrayerTimesScreen(carContext: CarContext) : Screen(carContext) {
  init {
    lifecycle.addObserver(CarMinuteTicker { invalidate() })
  }

  override fun onGetTemplate(): Template {
    val now = System.currentTimeMillis()
    val snapshot = PrayerSnapshot.load(carContext)
    val prayers = snapshot?.dailyPrayers(now).orEmpty().take(CarPlaces.MAX_ROWS)
    if (snapshot == null || prayers.isEmpty()) {
      return MessageTemplate.Builder("Ingen bønnetider lagret ennå.")
        .setTitle(TITLE)
        .setHeaderAction(Action.BACK)
        .build()
    }

    val current = snapshot.currentPrayer(now)
    val list = ItemList.Builder()
    prayers.forEach { prayer ->
      list.addItem(row(prayer, snapshot, current, now))
    }

    return ListTemplate.Builder()
      .setSingleList(list.build())
      .setTitle("$TITLE · ${snapshot.locationName}")
      .setHeaderAction(Action.BACK)
      .build()
  }

  private fun row(
    prayer: PrayerEntry,
    snapshot: PrayerSnapshot,
    current: PrayerEntry?,
    now: Long,
  ): Row {
    val jamat = prayer.jamat
    val detail = when {
      current != null && prayer.at == current.at -> "Nå"
      prayer.at > now -> PrayerFormat.countdown(prayer.at, now)
      else -> "Ferdig"
    }
    val jamatText = if (jamat != null && snapshot.hasJamatTimes) {
      val label = if (prayer.isJummah) "Jumuah" else "Jamaat"
      " · $label ${PrayerFormat.time(jamat)}"
    } else {
      ""
    }

    return Row.Builder()
      .setTitle("${prayer.displayLabel}  ${PrayerFormat.time(prayer.at)}")
      .addText("$detail$jamatText")
      .build()
  }

  private companion object {
    const val TITLE = "Bønnetider"
  }
}
