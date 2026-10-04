package no.irn.bonnetid.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build

object PrayerShortcuts {
  const val ACTION_REFRESH = "no.irn.bonnetid.widget.SHORTCUTS_REFRESH"

  private const val REQUEST_CODE = 41

  fun update(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) return
    if (context.packageManager.hasSystemFeature(PackageManager.FEATURE_AUTOMOTIVE)) return
    val manager = context.getSystemService(ShortcutManager::class.java) ?: return

    val now = System.currentTimeMillis()
    val snapshot = PrayerSnapshot.load(context)
    val next = snapshot?.let { PrayerMoment.resolve(it, now)?.next }
    val nextLabel = if (snapshot != null && next != null) {
      "Neste bønn: ${next.displayLabel} ${PrayerFormat.time(next.printedAt(snapshot.showJamat))}"
    } else {
      "Neste bønn"
    }

    val shortcuts = listOf(
      shortcut(context, "next", "Neste bønn", nextLabel, "bonnetid://", R.drawable.shortcut_next),
      shortcut(context, "qibla", "Qibla", "Qibla", "bonnetid://qibla", R.drawable.shortcut_qibla),
      shortcut(context, "calendar", "Kalender", "Kalender", "bonnetid://calendar", R.drawable.shortcut_calendar),
    )

    try {
      manager.dynamicShortcuts = shortcuts
    } catch (_: Exception) {
      return
    }

    if (next != null) WidgetChrome.schedule(context, refreshIntent(context), next.at)
  }

  private fun shortcut(
    context: Context,
    id: String,
    shortLabel: String,
    longLabel: String,
    uri: String,
    icon: Int,
  ): ShortcutInfo {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName)
    return ShortcutInfo.Builder(context, id)
      .setShortLabel(shortLabel)
      .setLongLabel(longLabel)
      .setIcon(Icon.createWithResource(context, icon))
      .setIntent(intent)
      .build()
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, PrayerBootReceiver::class.java).setAction(ACTION_REFRESH)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
  }
}
