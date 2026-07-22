const PLACE_TYPE_OPTIONS = [
  {
    value: "all",
    label: "Sve"
  },
  {
    value: "public_toilet",
    label: "Javni toaleti"
  },
  {
    value: "shopping_mall",
    label: "Tržni centri"
  },
  {
    value: "gas_station",
    label: "Pumpe"
  },
  {
  value: "bus_station",
  label: "Autobuske stanice"
},
{
  value: "train_station",
  label: "Železničke stanice"
},
{
  value: "sports_center",
  label: "Sportski centri"
}
];

export default function Filters({
  showOnlyOpen,
  showOnlyFree,
  selectedPlaceType,
  visibleCount,
  totalCount,
  onToggleOpen,
  onToggleFree,
  onChangePlaceType
}) {
  return (
    <section className="filters filters--advanced">
      <div className="filter-actions">
        <button
          type="button"
          className={
            showOnlyOpen
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={onToggleOpen}
        >
          Samo otvoreni
        </button>

        <button
          type="button"
          className={
            showOnlyFree
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={onToggleFree}
        >
          Besplatno
        </button>
      </div>

      <div
        className="filter-categories"
        role="group"
        aria-label="Vrsta lokacije"
      >
        {PLACE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              selectedPlaceType === option.value
                ? "category-filter category-filter--active"
                : "category-filter"
            }
            onClick={() => onChangePlaceType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <span className="results-count">
        Prikazano: {visibleCount} od {totalCount}
      </span>
    </section>
  );
}