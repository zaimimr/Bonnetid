package no.irn.bonnetid.wear

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import kotlinx.coroutines.delay
import no.irn.bonnetid.widget.PrayerEntry
import no.irn.bonnetid.widget.PrayerFormat
import no.irn.bonnetid.widget.PrayerMoment
import no.irn.bonnetid.widget.PrayerSnapshot
import no.irn.bonnetid.widget.SNAPSHOT_KEY
import no.irn.bonnetid.widget.SNAPSHOT_PREFS

private val Brand = Color(0xFF6FBA9D)
private val BrandContainer = Color(0xFF14463A)
private val OnBrandContainer = Color(0xFFE8F3EE)
private val OnBrandMuted = Color(0xFFB9D6CA)
private val Surface = Color(0xFF151F1B)
private val Ink = Color(0xFFF6F8F7)
private val InkMuted = Color(0xFF8C9A93)

private val WatchColors = ColorScheme(
  primary = Brand,
  onPrimary = Color(0xFF0F1714),
  primaryContainer = BrandContainer,
  onPrimaryContainer = OnBrandContainer,
  surfaceContainer = Surface,
  onSurface = Ink,
  onSurfaceVariant = InkMuted,
  background = Color.Black,
  onBackground = Ink,
)

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    WatchSnapshot.pull(this)
    setContent {
      MaterialTheme(colorScheme = WatchColors) {
        AppScaffold {
          PrayerScreen()
        }
      }
    }
  }
}

@Composable
private fun PrayerScreen() {
  val context = LocalContext.current
  var snapshot by remember { mutableStateOf(PrayerSnapshot.load(context)) }
  var now by remember { mutableLongStateOf(System.currentTimeMillis()) }

  DisposableEffect(context) {
    val prefs = context.getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
    val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
      if (key == SNAPSHOT_KEY) snapshot = PrayerSnapshot.load(context)
    }
    prefs.registerOnSharedPreferenceChangeListener(listener)
    onDispose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
  }

  LaunchedEffect(Unit) {
    while (true) {
      delay(60_000L - System.currentTimeMillis() % 60_000L)
      now = System.currentTimeMillis()
    }
  }

  val current = snapshot
  val moment = current?.let { PrayerMoment.resolve(it, now) }
  val listState = rememberScalingLazyListState()

  ScreenScaffold(scrollState = listState) { contentPadding ->
    if (current == null || moment == null) {
      Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Text("Åpne Bønnetid på telefonen", textAlign = TextAlign.Center)
      }
      return@ScreenScaffold
    }

    val next = moment.next
    ScalingLazyColumn(
      state = listState,
      contentPadding = contentPadding,
      modifier = Modifier.fillMaxSize(),
    ) {
      item {
        ListHeader { Text(current.mosqueName ?: current.locationName, textAlign = TextAlign.Center) }
      }
      item {
        NextPrayerCard(next, current.showJamat, now)
      }
      current.dailyPrayers(now).forEach { prayer ->
        item {
          PrayerRow(prayer, current.showJamat, prayer.at == next.at)
        }
      }
    }
  }
}

@Composable
private fun NextPrayerCard(next: PrayerEntry, showJamat: Boolean, now: Long) {
  val printed = next.printedAt(showJamat)
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .background(BrandContainer, RoundedCornerShape(24.dp))
      .padding(horizontal = 16.dp, vertical = 12.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text("Neste", style = MaterialTheme.typography.labelSmall, color = OnBrandMuted)
    Text(next.displayLabel, style = MaterialTheme.typography.titleMedium, color = OnBrandContainer)
    Text(
      PrayerFormat.time(printed),
      style = MaterialTheme.typography.displaySmall,
      color = OnBrandContainer,
      fontWeight = FontWeight.SemiBold,
    )
    Text(PrayerFormat.countdown(next.at, now), style = MaterialTheme.typography.bodySmall, color = OnBrandMuted)
    val jamat = next.jamat
    if (jamat != null && jamat != printed) {
      Text("Jamat ${PrayerFormat.time(jamat)}", style = MaterialTheme.typography.bodySmall, color = OnBrandMuted)
    }
  }
}

@Composable
private fun PrayerRow(prayer: PrayerEntry, showJamat: Boolean, isNext: Boolean) {
  val printed = prayer.printedAt(showJamat)
  val jamat = prayer.jamat
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .background(if (isNext) BrandContainer else Surface, RoundedCornerShape(20.dp))
      .padding(horizontal = 16.dp, vertical = 10.dp),
    horizontalAlignment = Alignment.End,
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Text(
        prayer.displayLabel,
        color = if (isNext) Brand else Ink,
        fontWeight = if (isNext) FontWeight.SemiBold else FontWeight.Normal,
        maxLines = 1,
      )
      Text(PrayerFormat.time(printed), color = Ink, fontWeight = FontWeight.SemiBold, softWrap = false)
    }
    if (jamat != null && jamat != printed) {
      Text(
        "Jamat ${PrayerFormat.time(jamat)}",
        style = MaterialTheme.typography.labelSmall,
        color = InkMuted,
        softWrap = false,
      )
    }
  }
}
