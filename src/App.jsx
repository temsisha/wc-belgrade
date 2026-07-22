import { useEffect, useState } from "react";

import toilets from "./data/toilets.json";

import ToiletMap from "./components/ToiletMap";
import ToiletList from "./components/ToiletList";
import Filters from "./components/Filters";
import LocationIntro from "./components/LocationIntro";

import { getToiletOpeningStatus } from "./utils/openingHours";

import { calculateDistanceKm, formatDistance } from "./utils/distance";

import {
  formatRouteDistance,
  formatRouteDuration,
  getWalkingRoute,
} from "./utils/route";

import "./index.css";

export default function App() {
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  const [showOnlyFree, setShowOnlyFree] = useState(false);

  const [selectedPlaceType, setSelectedPlaceType] = useState("all");

  const [userLocation, setUserLocation] = useState(null);

  const [locationStatus, setLocationStatus] = useState("idle");

  const [locationError, setLocationError] = useState("");

  const [route, setRoute] = useState(null);

  const [routeStatus, setRouteStatus] = useState("idle");

  const [routeError, setRouteError] = useState("");

  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const [selectedToiletId, setSelectedToiletId] = useState(null);

  const [focusUserRequest, setFocusUserRequest] = useState(0);

  const [fitFilteredToiletsRequest, setFitFilteredToiletsRequest] = useState(0);

  const [pendingFilterFit, setPendingFilterFit] = useState(false);

  async function showRoute(toilet) {
    setSelectedToiletId(toilet.id);
    setRouteError("");

    if (!userLocation) {
      setRouteError("Prvo dozvoli pristup svojoj lokaciji.");

      setIsMobileSheetOpen(true);

      return;
    }

    setRouteStatus("loading");

    try {
      const routeData = await getWalkingRoute(userLocation, toilet);

      setRoute({
        ...routeData,
        toiletId: toilet.id,
        toiletName: toilet.name,
      });

      setRouteStatus("success");
      setIsMobileSheetOpen(false);
    } catch (error) {
      console.error("Greška pri učitavanju rute:", error);

      setRoute(null);
      setRouteStatus("error");

      setRouteError(
        error instanceof Error ? error.message : "Ruta trenutno nije dostupna.",
      );

      setIsMobileSheetOpen(true);
    }
  }

  function selectToilet(toilet) {
    setSelectedToiletId(toilet.id);
    setIsMobileSheetOpen(false);
  }

  function clearRoute() {
    setRoute(null);
    setRouteError("");
    setRouteStatus("idle");
    setSelectedToiletId(null);
    setIsMobileSheetOpen(false);

    setFocusUserRequest((current) => current + 1);
  }

  function findMyLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationStatus("error");

      setLocationError("Tvoj browser ne podržava geolokaciju.");

      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,

          longitude: position.coords.longitude,

          accuracy: position.coords.accuracy,
        });

        setLocationStatus("success");
        setLocationError("");
        setIsMobileSheetOpen(false);
        setSelectedToiletId(null);
      },

      (error) => {
        setLocationStatus("error");

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Lokacija nije dozvoljena. Omogući je u podešavanjima browsera.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setLocationError("Trenutna lokacija nije dostupna.");
            break;

          case error.TIMEOUT:
            setLocationError("Pronalaženje lokacije je predugo trajalo.");
            break;

          default:
            setLocationError("Nismo uspeli da pronađemo tvoju lokaciju.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function prepareFilterChange() {
    /*
     * Zatvaramo sheet odmah nakon klika.
     */
    setIsMobileSheetOpen(false);

    /*
     * Zatvaramo popup i brišemo izbor pina.
     */
    setSelectedToiletId(null);

    /*
     * Ako je ruta aktivna, uklanjamo je jer
     * sada prikazujemo rezultate filtera.
     */
    setRoute(null);
    setRouteError("");
    setRouteStatus("idle");

    /*
     * FitBounds se pokreće tek nakon što React
     * izračuna novi visibleToilets niz.
     */
    setPendingFilterFit(true);
  }

  function toggleOpenFilter() {
    setShowOnlyOpen((current) => !current);

    prepareFilterChange();
  }

  function toggleFreeFilter() {
    setShowOnlyFree((current) => !current);

    prepareFilterChange();
  }

  function changePlaceTypeFilter(placeType) {
    setSelectedPlaceType(placeType);

    prepareFilterChange();
  }

  const toiletsWithDistance = toilets
    .map((toilet) => {
      if (!userLocation) {
        return {
          ...toilet,
          distanceKm: null,
        };
      }

      const distanceKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        toilet.latitude,
        toilet.longitude,
      );

      return {
        ...toilet,
        distanceKm,
      };
    })
    .sort((firstToilet, secondToilet) => {
      if (!userLocation) {
        return 0;
      }

      return firstToilet.distanceKm - secondToilet.distanceKm;
    });

  const visibleToilets = toiletsWithDistance.filter((toilet) => {
    const openingStatus = getToiletOpeningStatus(toilet);

    const matchesOpen = !showOnlyOpen || openingStatus.isOpen === true;

    const matchesFree = !showOnlyFree || toilet.fee === false;

    const matchesPlaceType =
      selectedPlaceType === "all" || toilet.placeType === selectedPlaceType;

    return matchesOpen && matchesFree && matchesPlaceType;
  });

  const visibleOpenToilets = visibleToilets.filter((toilet) => {
    const openingStatus = getToiletOpeningStatus(toilet);

    return openingStatus.isOpen === true;
  });

  const nearestOpenToilet =
    userLocation && visibleOpenToilets.length > 0
      ? visibleOpenToilets[0]
      : null;

  /*
   * Ovaj efekat se izvršava tek nakon rendera
   * sa novim filterom i novim visibleToilets.
   */
  useEffect(() => {
    if (!pendingFilterFit || !userLocation) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setFitFilteredToiletsRequest((current) => current + 1);

      setPendingFilterFit(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    pendingFilterFit,
    showOnlyOpen,
    showOnlyFree,
    selectedPlaceType,
    userLocation,
  ]);

  if (!userLocation) {
    return (
      <LocationIntro
        locationStatus={locationStatus}
        locationError={locationError}
        onAllowLocation={findMyLocation}
      />
    );
  }

  return (
    <main className="app">
      {locationError && <p className="location-error">{locationError}</p>}

      <section className="desktop-panels">
        {nearestOpenToilet && (
          <section className="nearest-toilet">
            <div>
              <span className="nearest-toilet__label">
                Najbliži otvoreni WC
              </span>

              <strong>{nearestOpenToilet.name}</strong>

              <span>{nearestOpenToilet.address}</span>
            </div>

            <div className="nearest-toilet__actions">
              <strong className="nearest-toilet__distance">
                {formatDistance(nearestOpenToilet.distanceKm)}
              </strong>

              <button
                type="button"
                className="navigation-button"
                onClick={() => showRoute(nearestOpenToilet)}
                disabled={routeStatus === "loading"}
              >
                {routeStatus === "loading"
                  ? "Učitavam rutu..."
                  : "Prikaži pešačku rutu"}
              </button>
            </div>
          </section>
        )}

        {routeError && <p className="route-error">{routeError}</p>}

        {route && (
          <section className="route-summary">
            <div>
              <span className="route-summary__label">Pešačka ruta</span>

              <strong>{route.toiletName}</strong>

              <span>
                {formatRouteDistance(route.distanceMeters)}
                {" · "}
                oko {formatRouteDuration(route.durationSeconds)}
              </span>
            </div>

            <button
              type="button"
              className="route-summary__close"
              onClick={clearRoute}
            >
              Skloni rutu
            </button>
          </section>
        )}

        <Filters
          showOnlyOpen={showOnlyOpen}
          showOnlyFree={showOnlyFree}
          selectedPlaceType={selectedPlaceType}
          visibleCount={visibleToilets.length}
          totalCount={toilets.length}
          onToggleOpen={toggleOpenFilter}
          onToggleFree={toggleFreeFilter}
          onChangePlaceType={changePlaceTypeFilter}
        />
      </section>

      <section className="map-wrapper">
        <ToiletMap
          toilets={visibleToilets}
          userLocation={userLocation}
          route={route}
          selectedToiletId={selectedToiletId}
          focusUserRequest={focusUserRequest}
          fitFilteredToiletsRequest={fitFilteredToiletsRequest}
          onShowRoute={showRoute}
        />
      </section>

      <section
        className={`mobile-sheet ${
          isMobileSheetOpen ? "mobile-sheet--open" : "mobile-sheet--collapsed"
        }`}
      >
        <button
          type="button"
          className="mobile-sheet__toggle"
          onClick={() => {
            setIsMobileSheetOpen((current) => !current);
          }}
          aria-label={
            isMobileSheetOpen
              ? "Sklopi listu lokacija"
              : "Otvori listu lokacija"
          }
        >
          <span className="mobile-sheet__handle" />
        </button>

        {!isMobileSheetOpen && (
          <>
            {route ? (
              <div className="mobile-sheet__compact mobile-sheet__compact--route">
                <div className="mobile-sheet__compact-info">
                  <span className="mobile-sheet__eyebrow">
                    Aktivna pešačka ruta
                  </span>

                  <strong>{route.toiletName}</strong>

                  <span className="mobile-sheet__meta">
                    {formatRouteDistance(route.distanceMeters)}
                    {" · "}
                    oko {formatRouteDuration(route.durationSeconds)}
                  </span>
                </div>

                <button
                  type="button"
                  className="mobile-sheet__stop-route-button"
                  onClick={clearRoute}
                >
                  Prekini rutu
                </button>
              </div>
            ) : nearestOpenToilet ? (
              <div className="mobile-sheet__compact">
                <button
                  type="button"
                  className="mobile-sheet__compact-info"
                  onClick={() => {
                    selectToilet(nearestOpenToilet);
                  }}
                >
                  <span className="mobile-sheet__eyebrow">
                    Najbliži otvoreni WC
                  </span>

                  <strong>{nearestOpenToilet.name}</strong>

                  <span className="mobile-sheet__meta">
                    {nearestOpenToilet.address}

                    {nearestOpenToilet.distanceKm != null && (
                      <>
                        {" · "}

                        {formatDistance(nearestOpenToilet.distanceKm)}
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className="mobile-sheet__route-button"
                  onClick={(event) => {
                    event.stopPropagation();

                    showRoute(nearestOpenToilet);
                  }}
                  disabled={routeStatus === "loading"}
                >
                  {routeStatus === "loading" ? "Učitavam..." : "Ruta"}
                </button>
              </div>
            ) : (
              <div className="mobile-sheet__compact">
                <div className="mobile-sheet__compact-info">
                  <span className="mobile-sheet__eyebrow">Nema rezultata</span>

                  <strong>Nema toaleta za izabrane filtere</strong>
                </div>
              </div>
            )}
          </>
        )}

        {isMobileSheetOpen && (
          <div className="mobile-sheet__expanded">
            <header className="mobile-sheet__header">
              <div>
                <span className="mobile-sheet__eyebrow">Lokacije</span>

                <h2>Toaleti u blizini</h2>
              </div>

              <span className="mobile-sheet__count">
                {visibleToilets.length}
              </span>
            </header>

            <div className="mobile-filters-wrapper">
              <Filters
                showOnlyOpen={showOnlyOpen}
                showOnlyFree={showOnlyFree}
                selectedPlaceType={selectedPlaceType}
                visibleCount={visibleToilets.length}
                totalCount={toilets.length}
                onToggleOpen={toggleOpenFilter}
                onToggleFree={toggleFreeFilter}
                onChangePlaceType={changePlaceTypeFilter}
              />
            </div>

            <ToiletList
              toilets={visibleToilets}
              selectedToiletId={selectedToiletId}
              onSelectToilet={selectToilet}
              onShowRoute={showRoute}
            />
          </div>
        )}
      </section>
    </main>
  );
}
