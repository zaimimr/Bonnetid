package no.irn.bonnetid.widget

import android.app.AlarmManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val SNAPSHOT_PREFS = "prayer_widget"
const val SNAPSHOT_KEY = "prayer_snapshot_v1"
const val PRAYER_LOG_KEY = "prayer_log_v1"

class PrayerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrayerWidget")

    Function("setSnapshot") { json: String ->
      val context = appContext.reactContext ?: return@Function
      context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(SNAPSHOT_KEY, json)
        .apply()
      PrayerAppWidget.updateAll(context)
      PrayerDayWidget.updateAll(context)
      PrayerTimelineWidget.updateAll(context)
      PrayerStatusNotifier.sync(context)
    }

    Function("getPrayerLog") {
      appContext.reactContext
        ?.getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        ?.getString(PRAYER_LOG_KEY, null)
    }

    Function("setPrayerLog") { json: String ->
      val context = appContext.reactContext ?: return@Function
      context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(PRAYER_LOG_KEY, json)
        .apply()
      PrayerAppWidget.updateAll(context)
      PrayerDayWidget.updateAll(context)
      PrayerTimelineWidget.updateAll(context)
      PrayerStatusNotifier.refreshPosted(context)
    }

    Function("areLiveActivitiesEnabled") { false }

    Function("canScheduleExactAlarms") {
      val context = appContext.reactContext ?: return@Function true
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function true
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
      alarms?.canScheduleExactAlarms() ?: true
    }

    Function("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function true
      val power = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
      power?.isIgnoringBatteryOptimizations(context.packageName) ?: true
    }

    Function("openSystemSettings") { kind: String ->
      val context = appContext.reactContext ?: return@Function
      val packageUri = Uri.parse("package:${context.packageName}")
      val intent = when {
        kind == "exactAlarm" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri)
        kind == "battery" -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        kind == "notifications" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ->
          Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        else -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri)
      }.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
      } catch (_: ActivityNotFoundException) {
        context.startActivity(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
      }
    }

    AsyncFunction("startOrUpdateActivity") { _: Map<String, Any?> ->
      // Android has no ActivityKit equivalent; the home screen widget carries the same data.
    }

    AsyncFunction("endActivity") {
      // No-op, see startOrUpdateActivity.
    }
  }
}
