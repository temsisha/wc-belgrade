import { getToiletOpeningStatus } from "../utils/openingHours";
import { formatDistance } from "../utils/distance";
import {
  getFeeLabel,
  getPlaceTypeLabel
} from "../utils/toiletLabels";

export default function ToiletList({
  toilets,
  selectedToiletId,
  routeStatus,
  onSelectToilet,
  onShowRoute
}) {
  const nearestToilets = toilets.slice(0, 6);

  if (nearestToilets.length === 0) {
    return (
      <section className="toilet-list-section">
        <div className="toilet-list-section__header">
          <div>
            <span>Lokacije</span>
            <h2>Nema pronađenih toaleta</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="toilet-list-section">
      <div className="toilet-list-section__header">
        <div>
          <span>U blizini</span>
          <h2>Najbliži toaleti</h2>
        </div>

        <span className="toilet-list-section__count">
          {nearestToilets.length}
        </span>
      </div>

      <div className="toilet-list">
        {nearestToilets.map((toilet, index) => {
          const openingStatus = getToiletOpeningStatus(toilet);
          const isSelected = selectedToiletId === toilet.id;

          return (
            <article
              key={toilet.id}
              className={
                isSelected
                  ? "toilet-list-item toilet-list-item--selected"
                  : "toilet-list-item"
              }
            >
              <button
                type="button"
                className="toilet-list-item__main"
                onClick={() => onSelectToilet(toilet)}
              >
                <span className="toilet-list-item__number">
                  {index + 1}
                </span>

                <span className="toilet-list-item__content">
                  <strong>{toilet.name}</strong>

                  <span className="toilet-list-item__address">
                    {toilet.address}
                  </span>

                  <span className="toilet-list-item__meta">
                    <span
                      className={
  openingStatus.isOpen === true
    ? "toilet-list-item__status toilet-list-item__status--open"
    : openingStatus.isOpen === false
      ? "toilet-list-item__status toilet-list-item__status--closed"
      : "toilet-list-item__status toilet-list-item__status--unknown"
}
                    >
                      {openingStatus.isOpen === true
  ? "Otvoreno"
  : openingStatus.isOpen === false
    ? "Zatvoreno"
    : "Vreme nije potvrđeno"}
                    </span>

                    <span>{getPlaceTypeLabel(toilet.placeType)}</span>
<span>{getFeeLabel(toilet.fee)}</span>
                  </span>
                </span>

                {toilet.distanceKm !== null && (
                  <strong className="toilet-list-item__distance">
                    {formatDistance(toilet.distanceKm)}
                  </strong>
                )}
              </button>

              <button
                type="button"
                className="toilet-list-item__route"
                disabled={routeStatus === "loading"}
                onClick={() => onShowRoute(toilet)}
              >
                {routeStatus === "loading"
                  ? "Učitavam..."
                  : "Ruta"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}