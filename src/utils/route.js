const OPEN_ROUTE_SERVICE_URL =
  "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

export async function getWalkingRoute(userLocation, toilet) {
  console.log("VITE ENV:", import.meta.env);
  console.log("ORS KEY EXISTS:", Boolean(import.meta.env.VITE_ORS_API_KEY));
  const apiKey = import.meta.env.VITE_ORS_API_KEY;

  if (!apiKey) {
    throw new Error("Nedostaje VITE_ORS_API_KEY u .env fajlu.");
  }

  const response = await fetch(OPEN_ROUTE_SERVICE_URL, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/geo+json",
    },
    body: JSON.stringify({
      coordinates: [
        [userLocation.longitude, userLocation.latitude],
        [toilet.longitude, toilet.latitude],
      ],
    }),
  });

  if (!response.ok) {
    let message = "Ruta trenutno nije dostupna.";

    try {
      const errorData = await response.json();

      message = errorData?.error?.message ?? errorData?.message ?? message;
    } catch {
      // Odgovor nije bio JSON.
    }

    throw new Error(message);
  }

  const data = await response.json();
  const feature = data.features?.[0];

  if (!feature?.geometry?.coordinates) {
    throw new Error("Servis nije vratio ispravnu rutu.");
  }

  /*
   * GeoJSON vraća:
   * [longitude, latitude]
   *
   * Leaflet očekuje:
   * [latitude, longitude]
   */
  const positions = feature.geometry.coordinates.map(
    ([longitude, latitude]) => [latitude, longitude],
  );

  const summary = feature.properties?.summary ?? {};

  return {
    positions,
    distanceMeters: summary.distance ?? null,
    durationSeconds: summary.duration ?? null,
  };
}

export function formatRouteDistance(distanceMeters) {
  if (distanceMeters === null) {
    return "";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(durationSeconds) {
  if (durationSeconds === null) {
    return "";
  }

  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}
