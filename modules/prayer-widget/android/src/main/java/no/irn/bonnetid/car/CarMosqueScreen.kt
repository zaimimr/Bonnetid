package no.irn.bonnetid.car

import android.Manifest
import android.content.Intent
import android.net.Uri
import androidx.car.app.CarContext
import androidx.car.app.CarToast
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.CarLocation
import androidx.car.app.model.ItemList
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Metadata
import androidx.car.app.model.Place
import androidx.car.app.model.PlaceListMapTemplate
import androidx.car.app.model.PlaceMarker
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import no.irn.bonnetid.widget.PrayerSnapshot

/** Nearest mosques on the map, with a tap handing the destination to the car's navigation app. */
class CarMosqueScreen(carContext: CarContext) : Screen(carContext) {
  private var askedForLocation = false

  override fun onGetTemplate(): Template {
    val snapshot = PrayerSnapshot.load(carContext)
    val mosques = snapshot?.mosques.orEmpty()
    if (mosques.isEmpty()) {
      return MessageTemplate.Builder("Åpne Bønnetid på telefonen for å hente moskeene.")
        .setTitle(TITLE)
        .setHeaderAction(Action.BACK)
        .build()
    }

    requestLocationOnce()

    val origin = CarPlaces.origin(carContext, snapshot)
    val nearby = CarPlaces.nearest(mosques, origin)
    val list = ItemList.Builder()
    nearby.forEachIndexed { index, entry ->
      val mosque = entry.mosque
      val place = Place.Builder(CarLocation.create(mosque.lat, mosque.lon))
        .setMarker(PlaceMarker.Builder().setLabel("${index + 1}").build())
        .build()
      val detail = listOfNotNull(CarPlaces.formatDistance(entry.distanceKm), mosque.address)
        .joinToString(" · ")

      list.addItem(
        Row.Builder()
          .setTitle(mosque.name)
          .addText(detail.ifEmpty { " " })
          .setMetadata(Metadata.Builder().setPlace(place).build())
          .setBrowsable(false)
          .setOnClickListener { navigateTo(mosque.name, mosque.lat, mosque.lon) }
          .build(),
      )
    }

    val title = if (CarPlaces.usingDeviceLocation(carContext)) {
      TITLE
    } else {
      "$TITLE nær ${snapshot?.locationName.orEmpty()}".trim()
    }

    return PlaceListMapTemplate.Builder()
      .setItemList(list.build())
      .setTitle(title)
      .setHeaderAction(Action.BACK)
      .setCurrentLocationEnabled(CarPlaces.hasLocationPermission(carContext))
      .build()
  }

  private fun navigateTo(name: String, lat: Double, lon: Double) {
    val uri = Uri.parse("geo:$lat,$lon?q=$lat,$lon(${Uri.encode(name)})")
    try {
      carContext.startCarApp(Intent(CarContext.ACTION_NAVIGATE, uri))
    } catch (error: Exception) {
      CarToast.makeText(carContext, "Fant ingen navigasjonsapp", CarToast.LENGTH_SHORT).show()
    }
  }

  /**
   * Without a fix the list falls back to the kommune the user picked, which is still useful, so
   * the prompt is asked once per screen and never blocks the template.
   */
  private fun requestLocationOnce() {
    if (askedForLocation || CarPlaces.hasLocationPermission(carContext)) return
    askedForLocation = true
    try {
      carContext.requestPermissions(
        listOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
      ) { _, _ -> invalidate() }
    } catch (error: Exception) {
      // Some hosts refuse permission prompts while driving; the fallback list still renders.
    }
  }

  private companion object {
    const val TITLE = "Moskeer"
  }
}
