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

import { LocateFixed } from "lucide-react";

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

      map.invalidateSize({
        pan: false,
      });

      map.setView(coordinates, 16, {
        animate: false,
      });

      /*
       * Pin pomeramo malo iznad
       * sklopljenog sheeta.
       */
      map.panBy([0, 75], {
        animate: false,
      });
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

      map.fitBounds(route.positions, {
        paddingTopLeft: [40, 60],

        paddingBottomRight: [40, 130],

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
    /*
     * Kada postoji ruta,
     * RouteFocus upravlja mapom.
     */
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
      const marker = markerRefs?.current?.[selectedToilet.id];

      marker?.openPopup();
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

          const offsetX = popupCenterX - mapCenterX;

          const offsetY = popupCenterY - mapCenterY;

          map.panBy([offsetX, offsetY], {
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
        <span class="toilet-cluster__count">
          ${count}
        </span>
      </div>
    `,

    className: "toilet-cluster-wrapper",

    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
}

function FilteredToiletsFocus({ toilets, fitRequest, userLocation }) {
  const map = useMap();

  const toiletsRef = useRef(toilets);

  /*
   * Uvek čuvamo najnoviji filtrirani niz,
   * ali fit ne pokrećemo samo zbog promene niza.
   */
  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    if (fitRequest === 0) {
      return;
    }

    map.stop();
    map.closePopup();

    /*
     * Sheet ima tranziciju, a cluster komponenta
     * mora prvo ponovo da napravi svoje markere.
     */
    const timeoutId = window.setTimeout(() => {
      const positions = toiletsRef.current
        .map((toilet) => [Number(toilet.latitude), Number(toilet.longitude)])
        .filter(
          ([latitude, longitude]) =>
            Number.isFinite(latitude) && Number.isFinite(longitude),
        );

      map.invalidateSize({
        pan: false,
      });

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

      const bounds = L.latLngBounds(positions);

      /*
       * maxZoom 14 garantuje da se više
       * lokacija i dalje vide grupisano.
       */
      map.fitBounds(bounds, {
        paddingTopLeft: [45, 45],

        paddingBottomRight: [45, 175],

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
    return "opening-status " + "opening-status--open";
  }

  if (isOpen === false) {
    return "opening-status " + "opening-status--closed";
  }

  return "opening-status " + "opening-status--unknown";
}

export default function ToiletMap({
  toilets,
  userLocation,
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

    map.invalidateSize({
      pan: false,
    });

    map.flyTo([userLocation.latitude, userLocation.longitude], 16, {
      animate: true,
      duration: 0.8,
    });
  }

  return (
    <div className="toilet-map-wrapper">
      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={16}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution={"&copy; OpenStreetMap contributors &copy; CARTO"}
          url={"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
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
          <Polyline
            positions={route.positions}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.85,
            }}
          />
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
                  <strong>{toilet.name}</strong>

                  <p>{toilet.address}</p>

                  <p className="toilet-place-type">
                    {getPlaceTypeLabel(toilet.placeType)}
                  </p>

                  <p>{getFeeLabel(toilet.fee)}</p>

                  {toilet.locationDescription && (
                    <p className="toilet-location-description">
                      {toilet.locationDescription}
                    </p>
                  )}

                  {toilet.distanceKm != null && (
                    <p>
                      Udaljenost:{" "}
                      <strong>{formatDistance(toilet.distanceKm)}</strong>
                    </p>
                  )}

                  <p className={getOpeningStatusClass(openingStatus.isOpen)}>
                    {openingStatus.label}
                  </p>

                  <div className="popup-actions">
                    <button
                      type="button"
                      className="popup-route-button"
                      onClick={() => handleShowRoute(toilet)}
                    >
                      Prikaži pešačku rutu
                    </button>

                    <button
                      type="button"
                      className="popup-report-button"
                      onClick={() => {
                        console.log("Prijavi problem", toilet.id);
                      }}
                    >
                      Prijavi problem
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {!route?.positions?.length && (
        <button
          type="button"
          className="map-location-button"
          onClick={focusUserLocation}
          disabled={!userLocation}
          aria-label="Prikaži moju lokaciju"
          title="Prikaži moju lokaciju"
        >
          <LocateFixed size={21} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
