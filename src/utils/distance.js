const EARTH_RADIUS_KM = 6371;

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function calculateDistanceKm(
  latitude1,
  longitude1,
  latitude2,
  longitude2,
) {
  const latitudeDifference = degreesToRadians(latitude2 - latitude1);
  const longitudeDifference = degreesToRadians(longitude2 - longitude1);

  const firstLatitude = degreesToRadians(latitude1);
  const secondLatitude = degreesToRadians(latitude2);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return null;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}
