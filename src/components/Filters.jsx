import {
  BusFront,
  CircleDollarSign,
  Clock3,
  Dumbbell,
  Fuel,
  LayoutGrid,
  MapPin,
  ShoppingBag,
  TrainFront,
} from "lucide-react";

const PLACE_TYPE_OPTIONS = [
  {
    value: "all",
    label: "Sve",
    Icon: LayoutGrid,
  },
  {
    value: "public_toilet",
    label: "Javni toaleti",
    Icon: MapPin,
  },
  {
    value: "shopping_mall",
    label: "Tržni centri",
    Icon: ShoppingBag,
  },
  {
    value: "gas_station",
    label: "Pumpe",
    Icon: Fuel,
  },
  {
    value: "bus_station",
    label: "Autobuske stanice",
    Icon: BusFront,
  },
  {
    value: "train_station",
    label: "Železničke stanice",
    Icon: TrainFront,
  },
  {
    value: "sports_center",
    label: "Sportski centri",
    Icon: Dumbbell,
  },
];

export default function Filters({
  showOnlyOpen,
  showOnlyFree,
  selectedPlaceType,
  visibleCount,
  totalCount,
  onToggleOpen,
  onToggleFree,
  onChangePlaceType,
}) {
  return (
    <section className="filters filters--advanced">
      <div
        className="filter-categories"
        role="group"
        aria-label="Vrsta lokacije"
      >
        {PLACE_TYPE_OPTIONS.map(({ value, label, Icon }) => {
          const isActive = selectedPlaceType === value;

          return (
            <button
              key={value}
              type="button"
              className={
                isActive
                  ? "category-filter category-filter--active"
                  : "category-filter"
              }
              onClick={() => onChangePlaceType(value)}
              aria-pressed={isActive}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="filter-actions" aria-label="Dodatni filteri">
        <button
          type="button"
          className={
            showOnlyOpen
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={onToggleOpen}
          aria-pressed={showOnlyOpen}
        >
          <Clock3 size={16} strokeWidth={2.1} aria-hidden="true" />
          <span>Otvoreni</span>
        </button>

        <button
          type="button"
          className={
            showOnlyFree
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={onToggleFree}
          aria-pressed={showOnlyFree}
        >
          <CircleDollarSign size={16} strokeWidth={2.1} aria-hidden="true" />
          <span>Besplatno</span>
        </button>
      </div>

      <span className="results-count">
        <strong>{visibleCount}</strong>
        <span> od {totalCount}</span>
      </span>
    </section>
  );
}
