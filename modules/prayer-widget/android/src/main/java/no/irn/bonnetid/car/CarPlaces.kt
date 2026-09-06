package no.irn.bonnetid.car

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import no.irn.bonnetid.widget.PrayerSnapshot
import no.irn.bonnetid.widget.SnapshotCoords
import no.irn.bonnetid.widget.SnapshotMosque

data class NearbyMosque(
  val mosque: SnapshotMosque,
  val distanceKm: Double,
)

object CarPlaces {
  const val MAX_ROWS = 6

  private const val EARTH_RADIUS_KM = 6371.0

  fun hasLocationPermission(context: Context): Boolean {
    val fine = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
    val coarse = context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
    return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED
  }

  /**
   * The car's own fix when it is allowed and fresh enough, otherwise the kommune the user picked
   * in the app. Never blocks: only last known positions are read.
   */
  fun origin(context: Context, snapshot: PrayerSnapshot?): SnapshotCoords? {
    return lastKnown(context) ?: snapshot?.origin
  }

  fun usingDeviceLocation(context: Context): Boolean = lastKnown(context) != null

  fun nearest(
    mosques: List<SnapshotMosque>,
    from: SnapshotCoords?,
    limit: Int = MAX_ROWS,
  ): List<NearbyMosque> {
    if (from == null) {
      return mosques.take(limit).map { NearbyMosque(it, Double.NaN) }
    }
    return mosques
      .map { NearbyMosque(it, distanceKm(from.lat, from.lon, it.lat, it.lon)) }
      .sortedBy { it.distanceKm }
      .take(limit)
  }

  private fun lastKnown(context: Context): SnapshotCoords? {
    if (!hasLocationPermission(context)) return null
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
    return try {
      manager.getProviders(true)
        .mapNotNull { provider -> manager.getLastKnownLocation(provider) }
        .maxByOrNull { it.time }
        ?.let { SnapshotCoords(it.latitude, it.longitude) }
    } catch (error: SecurityException) {
      null
    }
  }

  private fun distanceKm(fromLat: Double, fromLon: Double, toLat: Double, toLon: Double): Double {
    val dLat = Math.toRadians(toLat - fromLat)
    val dLon = Math.toRadians(toLon - fromLon)
    val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Math.toRadians(fromLat)) * Math.cos(Math.toRadians(toLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
