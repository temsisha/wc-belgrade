import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Bus,
  Dumbbell,
  Fuel,
  MapPin,
  Navigation,
  ShoppingBag,
  Store,
  Toilet,
  Train
} from "lucide-react";

const ICON_BY_PLACE_TYPE = {
  public_toilet: Toilet,
  shopping_mall: ShoppingBag,
  gas_station: Fuel,
  market: Store,
  bus_station: Bus,
  train_station: Train,
  sports_center: Dumbbell
};

const SUPPORTED_PLACE_TYPES = new Set(
  Object.keys(ICON_BY_PLACE_TYPE)
);

const iconCache = new Map();

function getOpeningState(isOpen) {
  if (isOpen === true) {
    return "open";
  }

  if (isOpen === false) {
    return "closed";
  }

  return "unknown";
}

export function createToiletMapIcon({
  placeType,
  isOpen,
  isSelected = false
}) {
  const normalizedPlaceType =
    SUPPORTED_PLACE_TYPES.has(placeType)
      ? placeType
      : "other";

  const openingState = getOpeningState(isOpen);

  const cacheKey = [
    normalizedPlaceType,
    openingState,
    isSelected ? "selected" : "default"
  ].join(":");

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const IconComponent =
    ICON_BY_PLACE_TYPE[normalizedPlaceType] ??
    MapPin;

  const iconSvg = renderToStaticMarkup(
    <IconComponent
      size={19}
      strokeWidth={2.4}
      aria-hidden="true"
    />
  );

  const selectedClass = isSelected
    ? " custom-map-marker--selected"
    : "";

  const icon = L.divIcon({
    className: "custom-map-icon",
    html: `
      <div
        class="
          custom-map-marker
          custom-map-marker--${normalizedPlaceType}
          ${selectedClass}
        "
      >
        <span class="custom-map-marker__icon">
          ${iconSvg}
        </span>

        <span
          class="
            custom-map-marker__status
            custom-map-marker__status--${openingState}
          "
        ></span>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -47]
  });

  iconCache.set(cacheKey, icon);

  return icon;
}

let userLocationIcon = null;

export function createUserLocationMapIcon() {
  if (userLocationIcon) {
    return userLocationIcon;
  }

  const iconSvg = renderToStaticMarkup(
    <Navigation
      size={18}
      strokeWidth={2.7}
      fill="currentColor"
      aria-hidden="true"
    />
  );

  userLocationIcon = L.divIcon({
    className: "custom-map-icon",
    html: `
      <div class="user-location-marker">
        <span class="user-location-marker__pulse"></span>

        <span class="user-location-marker__icon">
          ${iconSvg}
        </span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  });

  return userLocationIcon;
}