const PLACE_TYPE_LABELS = {
  public_toilet: "Javni toalet",
  shopping_mall: "Tržni centar",
  gas_station: "Benzinska pumpa",
  market: "Pijaca",
  bus_station: "Autobuska stanica",
  train_station: "Železnička stanica",
  museum: "Muzej",
  library: "Biblioteka",
  sports_center: "Sportski centar",
  cafe: "Kafić",
  restaurant: "Restoran",
};

export function getPlaceTypeLabel(placeType) {
  return PLACE_TYPE_LABELS[placeType] ?? "Druga lokacija";
}

export function getFeeLabel(fee) {
  if (fee === true) {
    return "Plaća se";
  }

  if (fee === false) {
    return "Besplatno";
  }

  return "Cena nije potvrđena";
}
