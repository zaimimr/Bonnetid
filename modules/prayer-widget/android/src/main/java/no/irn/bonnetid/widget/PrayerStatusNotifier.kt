package no.irn.bonnetid.widget

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle
import org.json.JSONArray

object PrayerStatusNotifier {
  const val ACTION_PRAYER_START = "no.irn.bonnetid.widget.PRAYER_START"
  const val ACTION_PRAYER_MARK = "no.irn.bonnetid.widget.PRAYER_MARK"
  const val ACTION_PRAYER_END = "no.irn.bonnetid.widget.PRAYER_END"
  const val CHANNEL_ID = "prayer-status"

  private const val NOTIFICATION_ID = 8021
  private const val SCHEDULED_KEY = "prayer_status_alarms_v1"
  private const val POSTED_KEY = "prayer_status_posted_v1"
  private const val SCHEME = "bonnetid-prayer"
  private const val START_HOST = "start"
  private const val MARK_HOST = "mark"
  private const val END_HOST = "end"
  private const val EXTRA_REQUEST_PROMOTED_ONGOING = "android.requestPromotedOngoing"

  fun sync(context: Context) {
    val snapshot = PrayerSnapshot.load(context)
    cancelScheduled(context)

    if (snapshot == null || !snapshot.lockScreenEnabled) {
      clear(context)
      return
    }

    val alarms = alarmManager(context) ?: return
    val now = System.currentTimeMillis()
    val scheduled = JSONArray()

    for (day in snapshot.days) {
      for (prayer in day.prayers) {
        if (!prayer.isPrayer || prayer.at <= now) continue
        scheduleWakeup(alarms, prayer.at, startIntent(context, day.date, prayer.kind))
        scheduled.put("${day.date}|${prayer.kind}")
      }
    }

    postCurrent(context, snapshot, now)
    rearmEndAlarm(context, snapshot, alarms, now)

    context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(SCHEDULED_KEY, scheduled.toString())
      .apply()
  }

  fun handle(context: Context, intent: Intent) {
    val segments = intent.data?.pathSegments ?: return
    val date = segments.getOrNull(0) ?: return
    val kind = segments.getOrNull(1) ?: return

    when (intent.action) {
      ACTION_PRAYER_START -> post(context, date, kind)
      ACTION_PRAYER_MARK -> mark(context, date, kind, segments.getOrNull(2) ?: return)
      ACTION_PRAYER_END -> end(context, date, kind)
    }
  }

  private fun end(context: Context, date: String, kind: String) {
    val posted = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(POSTED_KEY, null)
    if (posted == "$date|$kind") clear(context)
  }

  private fun postCurrent(context: Context, snapshot: PrayerSnapshot, now: Long) {
    val prayer = snapshot.currentPrayer(now) ?: return
    val date = snapshot.days
      .firstOrNull { day -> day.prayers.any { it.kind == prayer.kind && it.at == prayer.at } }
      ?.date
      ?: return
    val posted = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(POSTED_KEY, null)
    if (posted == "$date|${prayer.kind}") return
    post(context, date, prayer.kind)
  }

  private fun rearmEndAlarm(context: Context, snapshot: PrayerSnapshot, alarms: AlarmManager, now: Long) {
    val posted = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(POSTED_KEY, null)
      ?: return
    val parts = posted.split("|")
    if (parts.size != 2) return
    val day = snapshot.days.firstOrNull { it.date == parts[0] } ?: return clear(context)
    val prayer = day.prayers.firstOrNull { it.kind == parts[1] && it.isPrayer } ?: return clear(context)
    val endsAt = snapshot.windowEnd(prayer) ?: return
    if (endsAt <= now) return clear(context)
    scheduleWakeup(alarms, endsAt, endIntent(context, parts[0], parts[1]))
  }

  private fun scheduleWakeup(alarms: AlarmManager, at: Long, operation: PendingIntent) {
    val exactAllowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
    when {
      exactAllowed && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, operation)
      else -> alarms.setExact(AlarmManager.RTC_WAKEUP, at, operation)
    }
  }

  fun refreshPosted(context: Context) {
    val posted = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(POSTED_KEY, null)
      ?: return
    val parts = posted.split("|")
    if (parts.size != 2) return
    if (PrayerLogStore.statusOf(context, parts[0], parts[1]) == null) return
    clear(context)
  }

  private fun mark(context: Context, date: String, kind: String, status: String) {
    if (status != PrayerLogStore.STATUS_PRAYED && status != PrayerLogStore.STATUS_SKIPPED) return
    PrayerLogStore.mark(context, date, kind, status)
    clear(context)
    PrayerAppWidget.updateAll(context)
    PrayerDayWidget.updateAll(context)
  }

  private fun clear(context: Context) {
    notificationManager(context)?.cancel(NOTIFICATION_ID)
    context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(POSTED_KEY)
      .apply()
  }

  @Suppress("DEPRECATION")
  private fun post(context: Context, date: String, kind: String) {
    val manager = notificationManager(context) ?: return
    clear(context)

    val snapshot = PrayerSnapshot.load(context) ?: return
    if (!snapshot.lockScreenEnabled || !canPost(context, manager)) return

    val day = snapshot.days.firstOrNull { it.date == date } ?: return
    val prayer = day.prayers.firstOrNull { it.kind == kind && it.isPrayer } ?: return
    if (PrayerLogStore.statusOf(context, date, kind) != null) return

    val now = System.currentTimeMillis()
    val endsAt = snapshot.windowEnd(prayer)
    if (endsAt != null && now >= endsAt) return

    ensureChannel(context, manager)

    val label = prayer.displayLabel
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      Notification.Builder(context)
        .setPriority(Notification.PRIORITY_HIGH)
        .setSound(null)
        .setVibrate(null)
    }

    builder
      .setSmallIcon(R.drawable.prayer_widget_status_icon)
      .setContentTitle("$label · ${PrayerFormat.time(prayer.at)}")
      .setContentText(
        if (endsAt != null) "Går ut ${PrayerFormat.time(endsAt)} · har du bedt $label?"
        else "Har du bedt $label?",
      )
      .setWhen(prayer.at)
      .setShowWhen(true)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .setCategory(Notification.CATEGORY_REMINDER)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setContentIntent(openAppIntent(context))
      .addExtras(Bundle().apply { putBoolean(EXTRA_REQUEST_PROMOTED_ONGOING, true) })
      .addAction(
        action(context, R.drawable.prayer_widget_check, "Bedt", date, kind, PrayerLogStore.STATUS_PRAYED),
      )
      .addAction(
        action(context, R.drawable.prayer_widget_skip, "Hopp over", date, kind, PrayerLogStore.STATUS_SKIPPED),
      )

    if (endsAt != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        builder
          .setWhen(endsAt)
          .setUsesChronometer(true)
          .setChronometerCountDown(true)
      }
      alarmManager(context)?.let { scheduleWakeup(it, endsAt, endIntent(context, date, kind)) }
    }

    manager.notify(NOTIFICATION_ID, builder.build())
    context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(POSTED_KEY, "$date|$kind")
      .apply()
  }

  private fun action(
    context: Context,
    iconId: Int,
    title: String,
    date: String,
    kind: String,
    status: String,
  ): Notification.Action {
    return Notification.Action.Builder(
      Icon.createWithResource(context, iconId),
      title,
      markIntent(context, date, kind, status),
    ).build()
  }

  private fun canPost(context: Context, manager: NotificationManager): Boolean {
    if (!manager.areNotificationsEnabled()) return false
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
    return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
      PackageManager.PERMISSION_GRANTED
  }

  private fun ensureChannel(context: Context, manager: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      context.getString(R.string.prayer_status_channel_name),
      NotificationManager.IMPORTANCE_HIGH,
    )
    channel.description = context.getString(R.string.prayer_status_channel_description)
    channel.setSound(null, null)
    channel.enableVibration(false)
    channel.setShowBadge(false)
    channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    manager.createNotificationChannel(channel)
  }

  private fun cancelScheduled(context: Context) {
    val alarms = alarmManager(context) ?: return
    val prefs = context.getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(SCHEDULED_KEY, null) ?: return
    val keys = try {
      JSONArray(raw)
    } catch (error: Exception) {
      return
    }
    for (index in 0 until keys.length()) {
      val parts = keys.optString(index).split("|")
      if (parts.size != 2) continue
      alarms.cancel(startIntent(context, parts[0], parts[1]))
      alarms.cancel(endIntent(context, parts[0], parts[1]))
    }
    prefs.edit().remove(SCHEDULED_KEY).apply()
  }

  private fun startIntent(context: Context, date: String, kind: String): PendingIntent {
    val uri = Uri.parse("$SCHEME://$START_HOST/$date/$kind")
    val intent = Intent(context, PrayerStatusReceiver::class.java)
      .setAction(ACTION_PRAYER_START)
      .setData(uri)
    return PendingIntent.getBroadcast(context, uri.hashCode(), intent, immutableFlags())
  }

  private fun endIntent(context: Context, date: String, kind: String): PendingIntent {
    val uri = Uri.parse("$SCHEME://$END_HOST/$date/$kind")
    val intent = Intent(context, PrayerStatusReceiver::class.java)
      .setAction(ACTION_PRAYER_END)
      .setData(uri)
    return PendingIntent.getBroadcast(context, uri.hashCode(), intent, immutableFlags())
  }

  private fun markIntent(
    context: Context,
    date: String,
    kind: String,
    status: String,
  ): PendingIntent {
    val uri = Uri.parse("$SCHEME://$MARK_HOST/$date/$kind/$status")
    val intent = Intent(context, PrayerStatusReceiver::class.java)
      .setAction(ACTION_PRAYER_MARK)
      .setData(uri)
    return PendingIntent.getBroadcast(context, uri.hashCode(), intent, immutableFlags())
  }

  private fun openAppIntent(context: Context): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bonnetid://"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, 2, intent, immutableFlags())
  }

  private fun immutableFlags(): Int {
    return PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  }

  private fun alarmManager(context: Context): AlarmManager? {
    return context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
  }

  private fun notificationManager(context: Context): NotificationManager? {
    return context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
  }
}
