import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Flag, LocateFixed, MapPin, Navigation } from "lucide-react";

import { getToiletOpeningStatus } from "../utils/openingHours";
import { formatDistance } from "../utils/distance";
import { getFeeLabel, getPlaceTypeLabel } from "../utils/toiletLabels";
import {
  createToiletMapIcon,
  createUserLocationMapIcon,
} from "../utils/mapIcons";

import "react-leaflet-cluster/dist/assets/MarkerCluster.css";

function MapInstanceBridge({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null;
}

function UserLocationFocus({ userLocation, focusUserRequest }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const coordinates = [userLocation.latitude, userLocation.longitude];

    const timeoutId = window.setTimeout(() => {
      map.closePopup();
      map.invalidateSize({ pan: false });
      map.setView(coordinates, 16, { animate: false });
      map.panBy([0, 82], { animate: false });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, userLocation?.latitude, userLocation?.longitude, focusUserRequest]);

  return null;
}

function RouteFocus({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.positions?.length) {
      return;
    }

    map.stop();
    map.closePopup();

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize({
        pan: false,
      });

      const isMobile = map.getContainer().clientWidth <= 640;

      map.fitBounds(route.positions, {
        /*
         * Na mobilnom ostavljamo slobodan prostor:
         * levo za + / − kontrole
         * gore za logo i filtere
         * dole za route bar
         */
        paddingTopLeft: isMobile ? [92, 180] : [48, 96],

        paddingBottomRight: isMobile ? [42, 125] : [48, 160],

        animate: true,
        duration: 0.8,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, route]);

  return null;
}

function SelectedToiletFocus({ selectedToilet, markerRefs, route }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedToilet || route?.positions?.length) {
      return;
    }

    map.stop();
    map.closePopup();

    map.flyTo([selectedToilet.latitude, selectedToilet.longitude], 17, {
      animate: true,
      duration: 0.8,
    });

    const timeoutId = window.setTimeout(() => {
      markerRefs?.current?.[selectedToilet.id]?.openPopup();
    }, 850);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, markerRefs, selectedToilet?.id, route?.positions?.length]);

  return null;
}

function PopupCenterController({ disabled = false }) {
  const map = useMap();

  useEffect(() => {
    if (disabled) {
      return;
    }

    let firstFrameId;
    let secondFrameId;

    function handlePopupOpen(event) {
      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          const popupElement = event.popup.getElement();
          const mapElement = map.getContainer();

          if (!popupElement || !mapElement) {
            return;
          }

          const popupRect = popupElement.getBoundingClientRect();
          const mapRect = mapElement.getBoundingClientRect();
          const popupCenterX =
            popupRect.left - mapRect.left + popupRect.width / 2;
          const popupCenterY =
            popupRect.top - mapRect.top + popupRect.height / 2;
          const mapCenterX = mapRect.width / 2;
          const mapCenterY = mapRect.height / 2;

          map.panBy([popupCenterX - mapCenterX, popupCenterY - mapCenterY], {
            animate: true,
            duration: 0.45,
          });
        });
      });
    }

    map.on("popupopen", handlePopupOpen);

    return () => {
      map.off("popupopen", handlePopupOpen);

      if (firstFrameId) {
        window.cancelAnimationFrame(firstFrameId);
      }

      if (secondFrameId) {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, [map, disabled]);

  return null;
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  let sizeClass = "toilet-cluster--small";

  if (count >= 10) {
    sizeClass = "toilet-cluster--medium";
  }

  if (count >= 25) {
    sizeClass = "toilet-cluster--large";
  }

  return L.divIcon({
    html: `
      <div class="toilet-cluster ${sizeClass}">
        <span class="toilet-cluster__ring"></span>
        <span class="toilet-cluster__count">${count}</span>
      </div>
    `,
    className: "toilet-cluster-wrapper",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
}

const nearestToiletPulseIcon = L.divIcon({
  className: "nearest-toilet-pulse-wrapper",

  html: `
    <span class="nearest-toilet-pulse">
      <span class="nearest-toilet-pulse__ring"></span>
      <span class="nearest-toilet-pulse__ring nearest-toilet-pulse__ring--delayed"></span>
    </span>
  `,

  iconSize: [75, 75],
  iconAnchor: [50, 58],
});

function FilteredToiletsFocus({ toilets, fitRequest, userLocation }) {
  const map = useMap();
  const toiletsRef = useRef(toilets);

  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    if (fitRequest === 0) {
      return;
    }

    map.stop();
    map.closePopup();

    const timeoutId = window.setTimeout(() => {
      const positions = toiletsRef.current
        .map((toilet) => [Number(toilet.latitude), Number(toilet.longitude)])
        .filter(
          ([latitude, longitude]) =>
            Number.isFinite(latitude) && Number.isFinite(longitude),
        );

      map.invalidateSize({ pan: false });

      if (positions.length === 0) {
        if (userLocation) {
          map.flyTo([userLocation.latitude, userLocation.longitude], 15, {
            animate: true,
            duration: 0.8,
          });
        }

        return;
      }

      if (positions.length === 1) {
        map.flyTo(positions[0], 16, {
          animate: true,
          duration: 0.8,
        });
        return;
      }

      map.fitBounds(L.latLngBounds(positions), {
        paddingTopLeft: [48, 100],
        paddingBottomRight: [48, 210],
        maxZoom: 14,
        animate: true,
        duration: 0.8,
      });
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [map, fitRequest, userLocation]);

  return null;
}

function getOpeningStatusClass(isOpen) {
  if (isOpen === true) {
    return "map-popup__status map-popup__status--open";
  }

  if (isOpen === false) {
    return "map-popup__status map-popup__status--closed";
  }

  return "map-popup__status map-popup__status--unknown";
}

export default function ToiletMap({
  toilets,
  userLocation,
  nearestToilet,
  route,
  selectedToiletId,
  focusUserRequest,
  fitFilteredToiletsRequest,
  onShowRoute,
}) {
  const markerRefs = useRef({});
  const mapRef = useRef(null);

  const selectedToilet = toilets.find(
    (toilet) => toilet.id === selectedToiletId,
  );

  function handleShowRoute(toilet) {
    markerRefs.current[toilet.id]?.closePopup();
    onShowRoute(toilet);
  }

  function focusUserLocation(event) {
    event.preventDefault();
    event.stopPropagation();

    const map = mapRef.current;

    if (!map || !userLocation) {
      return;
    }

    map.stop();
    map.closePopup();
    map.invalidateSize({ pan: false });
    map.flyTo([userLocation.latitude, userLocation.longitude], 16, {
      animate: true,
      duration: 0.8,
    });
  }

  function zoomInMap() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.zoomIn();
  }

  function zoomOutMap() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.zoomOut();
  }

  return (
    <div className="toilet-map-wrapper">
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={16}
        zoomControl={false}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <MapInstanceBridge mapRef={mapRef} />

        <UserLocationFocus
          userLocation={userLocation}
          focusUserRequest={focusUserRequest}
        />

        <FilteredToiletsFocus
          toilets={toilets}
          userLocation={userLocation}
          fitRequest={fitFilteredToiletsRequest}
        />

        <RouteFocus route={route} />

        <SelectedToiletFocus
          selectedToilet={selectedToilet}
          markerRefs={markerRefs}
          route={route}
        />

        <PopupCenterController disabled={Boolean(route?.positions?.length)} />

        {route?.positions?.length > 0 && (
          <>
            <Polyline
              positions={route.positions}
              pathOptions={{
                color: "rgba(255, 255, 255, 0.96)",
                weight: 9,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={route.positions}
              pathOptions={{
                color: "#0b8f83",
                weight: 5,
                opacity: 1,
                dashArray: "2 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationMapIcon()}
            zIndexOffset={2000}
          >
            <Popup autoPan={false}>
              <div className="user-location-popup">
                <strong>Tvoja lokacija</strong>
                <span>Odavde računamo udaljenost i rutu.</span>
              </div>
            </Popup>
          </Marker>
        )}

        {nearestToilet && !route?.positions?.length && (
          <Marker
            key={`nearest-toilet-pulse-${nearestToilet.id}`}
            position={[nearestToilet.latitude, nearestToilet.longitude]}
            icon={nearestToiletPulseIcon}
            interactive={false}
            keyboard={false}
            zIndexOffset={-1000}
          />
        )}

        <MarkerClusterGroup
          key={`toilet-clusters-${fitFilteredToiletsRequest}`}
          chunkedLoading
          maxClusterRadius={55}
          disableClusteringAtZoom={16}
          showCoverageOnHover={false}
          zoomToBoundsOnClick
          spiderfyOnMaxZoom
          iconCreateFunction={createClusterIcon}
        >
          {toilets.map((toilet) => {
            const openingStatus = getToiletOpeningStatus(toilet);
            const isSelected =
              selectedToiletId === toilet.id || route?.toiletId === toilet.id;
            const markerIcon = createToiletMapIcon({
              placeType: toilet.placeType,
              isOpen: openingStatus.isOpen,
              isSelected,
            });

            return (
              <Marker
                key={toilet.id}
                icon={markerIcon}
                zIndexOffset={isSelected ? 1000 : 0}
                ref={(marker) => {
                  if (marker) {
                    markerRefs.current[toilet.id] = marker;
                  } else {
                    delete markerRefs.current[toilet.id];
                  }
                }}
                position={[toilet.latitude, toilet.longitude]}
              >
                <Popup autoPan={false}>
                  <article className="map-popup">
                    <div className="map-popup__topline">
                      <span className="map-popup__type">
                        {getPlaceTypeLabel(toilet.placeType)}
                      </span>
                      <span
                        className={getOpeningStatusClass(openingStatus.isOpen)}
                      >
                        {openingStatus.label}
                      </span>
                    </div>

                    <h3>{toilet.name}</h3>

                    <p className="map-popup__address">
                      <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                      <span>{toilet.address}</span>
                    </p>

                    <div className="map-popup__facts">
                      <span>{getFeeLabel(toilet.fee)}</span>
                      {toilet.distanceKm != null && (
                        <span>{formatDistance(toilet.distanceKm)}</span>
                      )}
                    </div>

                    {toilet.locationDescription && (
                      <p className="map-popup__description">
                        {toilet.locationDescription}
                      </p>
                    )}

                    <div className="map-popup__actions">
                      <button
                        type="button"
                        className="map-popup__route"
                        onClick={() => handleShowRoute(toilet)}
                      >
                        <Navigation
                          size={16}
                          strokeWidth={2.3}
                          aria-hidden="true"
                        />
                        <span>Prikaži rutu</span>
                      </button>

                      <button
                        type="button"
                        className="map-popup__report"
                        onClick={() => {
                          console.log("Prijavi problem", toilet.id);
                        }}
                      >
                        <Flag size={15} strokeWidth={2.1} aria-hidden="true" />
                        <span>Prijavi problem</span>
                      </button>
                    </div>
                  </article>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="mobile-map-controls">
        <div className="mobile-map-controls__zoom">
          <button
            type="button"
            onClick={zoomInMap}
            aria-label="Uvećaj mapu"
            title="Uvećaj mapu"
          >
            +
          </button>

          <button
            type="button"
            onClick={zoomOutMap}
            aria-label="Umanji mapu"
            title="Umanji mapu"
          >
            −
          </button>
        </div>

        {!route?.positions?.length && (
          <button
            type="button"
            className="mobile-map-controls__location"
            onClick={focusUserLocation}
            disabled={!userLocation}
            aria-label="Prikaži moju lokaciju"
            title="Prikaži moju lokaciju"
          >
            <LocateFixed size={21} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
