import { LocateFixed, MapPinned, Navigation } from "lucide-react";

export default function LocationIntro({
  locationStatus,
  locationError,
  onAllowLocation,
}) {
  const isLoading = locationStatus === "loading";

  return (
    <main className="location-intro">
      <div className="location-intro__background">
        <span className="location-intro__shape location-intro__shape--one" />
        <span className="location-intro__shape location-intro__shape--two" />
        <span className="location-intro__shape location-intro__shape--three" />
      </div>

      <div className="location-intro__content">
        <div className="location-intro__visual">
          <div className="location-intro__person">
            <div className="location-intro__person-head" />

            <div className="location-intro__person-body">
              <Navigation size={30} strokeWidth={2.3} aria-hidden="true" />
            </div>
          </div>

          <div className="location-intro__phone">
            <div className="location-intro__phone-notch" />

            <div className="location-intro__phone-map">
              <span className="location-intro__map-line location-intro__map-line--one" />
              <span className="location-intro__map-line location-intro__map-line--two" />
              <span className="location-intro__map-line location-intro__map-line--three" />

              <span className="location-intro__map-pin">
                <MapPinned size={31} strokeWidth={2.4} aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        <div className="location-intro__copy">
          <span className="location-intro__eyebrow">Gde je WC?</span>

          <h1>Pronađi najbliži toalet</h1>

          <p>
            Dozvoli pristup svojoj lokaciji da bismo prikazali javne toalete u
            tvojoj blizini.
          </p>
        </div>

        {locationError && (
          <div className="location-intro__error" role="alert">
            {locationError}
          </div>
        )}

        <button
          type="button"
          className="location-intro__button"
          onClick={onAllowLocation}
          disabled={isLoading}
        >
          <LocateFixed size={21} strokeWidth={2.5} aria-hidden="true" />

          <span>
            {isLoading ? "Određujemo lokaciju..." : "Dozvoli pristup lokaciji"}
          </span>
        </button>

        <p className="location-intro__privacy">
          Lokacija se koristi samo za prikaz najbližih toaleta i računanje
          pešačke rute.
        </p>
      </div>
    </main>
  );
}
