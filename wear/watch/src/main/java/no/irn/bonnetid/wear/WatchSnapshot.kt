package no.irn.bonnetid.wear

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import no.irn.bonnetid.widget.PrayerEntry
import no.irn.bonnetid.widget.PrayerSnapshot
import no.irn.bonnetid.widget.SNAPSHOT_KEY
import no.irn.bonnetid.widget.SNAPSHOT_PREFS
import no.irn.bonnetid.widget.WearSnapshot

data class PrayerWindow(
  val start: Long,
  val end: Long,
  val next: PrayerEntry,
  val upcoming: List<PrayerEntry>,
)

object WatchSnapshot {
  fun store(context: Context, bytes: ByteArray) {
    val json = try {
      WearSnapshot.decode(bytes)
    } catch (_: Exception) {
      return
    }
    if (PrayerSnapshot.parse(json) == null) return
    context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(SNAPSHOT_KEY, json)
      .apply()
    TileService.getUpdater(context).requestUpdate(PrayerTileService::class.java)
    ComplicationDataSourceUpdateRequester
      .create(context, ComponentName(context, NextPrayerComplicationService::class.java))
      .requestUpdateAll()
  }

  fun pull(context: Context) {
    Wearable.getDataClient(context).dataItems.addOnSuccessListener { buffer ->
      try {
        buffer
          .firstOrNull { it.uri.path == WearSnapshot.PATH }
          ?.let { DataMapItem.fromDataItem(it).dataMap.getByteArray(WearSnapshot.KEY) }
          ?.let { store(context, it) }
      } finally {
        buffer.release()
      }
    }
  }

  fun windows(snapshot: PrayerSnapshot, now: Long, limit: Int): List<PrayerWindow> {
    val prayers = snapshot.allPrayers.filter { it.isPrayer }
    val first = prayers.indexOfFirst { it.at > now }
    if (first < 0) return emptyList()
    return (first until minOf(prayers.size, first + limit)).map { index ->
      val start = prayers.getOrNull(index - 1)?.at ?: now
      PrayerWindow(
        start = start,
        end = prayers[index].at,
        next = prayers[index].resolveJummah(start),
        upcoming = prayers.drop(index + 1).take(2).map { it.resolveJummah(start) },
      )
    }
  }
}
