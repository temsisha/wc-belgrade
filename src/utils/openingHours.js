const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getCurrentSeason(date) {
  const month = date.getMonth() + 1;

  return month >= 4 && month <= 10 ? "summer" : "winter";
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function getScheduleForDate(toilet, date) {
  const dayName = DAY_NAMES[date.getDay()];
  const openingHours = toilet.openingHours;

  if (!openingHours) {
    return null;
  }

  // Novi format za tržne centre, pumpe, pijace...
  if (openingHours.weekly) {
    const hours = openingHours.weekly[dayName] ?? openingHours.weekly.default;

    if (!hours) {
      return {
        closed: true,
        dayName,
      };
    }

    return {
      closed: false,
      hours,
      dayName,
    };
  }

  // Postojeći sezonski format javnih toaleta.
  const season = getCurrentSeason(date);
  const seasonalSchedule = openingHours[season];

  if (!seasonalSchedule) {
    return null;
  }

  const closedDays = seasonalSchedule.closedDays ?? [];

  if (closedDays.includes(dayName)) {
    return {
      closed: true,
      dayName,
    };
  }

  return {
    closed: false,
    hours: seasonalSchedule.default,
    dayName,
  };
}

export function getToiletOpeningStatus(toilet, date = new Date()) {
  const schedule = getScheduleForDate(toilet, date);

  if (!schedule) {
    return {
      isOpen: null,
      label: "Radno vreme nije poznato",
    };
  }

  if (schedule.closed) {
    return {
      isOpen: false,
      label: "Danas ne radi",
    };
  }

  const [openingTime, closingTime] = schedule.hours;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutes = timeToMinutes(closingTime);

  const isOpen =
    currentMinutes >= openingMinutes && currentMinutes < closingMinutes;

  if (isOpen) {
    return {
      isOpen: true,
      label: `Otvoreno do ${closingTime}`,
      openingTime,
      closingTime,
    };
  }

  if (currentMinutes < openingMinutes) {
    return {
      isOpen: false,
      label: `Otvara se u ${openingTime}`,
      openingTime,
      closingTime,
    };
  }

  return {
    isOpen: false,
    label: "Zatvoreno",
    openingTime,
    closingTime,
  };
}
