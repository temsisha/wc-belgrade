export function getGoogleMapsDirectionsUrl(toilet, userLocation = null) {
  const url = new URL("https://www.google.com/maps/dir/");

  url.searchParams.set("api", "1");

  if (userLocation) {
    url.searchParams.set(
      "origin",
      `${userLocation.latitude},${userLocation.longitude}`,
    );
  }

  url.searchParams.set("destination", `${toilet.latitude},${toilet.longitude}`);

  url.searchParams.set("travelmode", "walking");
  url.searchParams.set("dir_action", "navigate");

  return url.toString();
}
