export function timeDifference(date1, date2) {
  const current = date1;
  const previous = date2;

  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = current - previous;

  let result = "";

  if (elapsed < 0) {
    result += "in ";
  }

  const absElapsed = Math.abs(elapsed);

  if (absElapsed < msPerMinute) {
    let res = Math.round(absElapsed / 1000);
    result += res + " second" + (res !== 1 ? "s" : "");
  } else if (absElapsed < msPerHour) {
    let res = Math.round(absElapsed / msPerMinute);
    result += res + " minute" + (res !== 1 ? "s" : "");
  } else if (absElapsed < msPerDay) {
    let res = Math.round(absElapsed / msPerHour);
    result += res + " hour" + (res !== 1 ? "s" : "");
  } else if (absElapsed < msPerMonth) {
    let res = Math.round(absElapsed / msPerDay);
    result += res + " day" + (res !== 1 ? "s" : "");
  } else if (absElapsed < msPerYear) {
    let res = Math.round(absElapsed / msPerMonth);
    result += res + " month" + (res !== 1 ? "s" : "");
  } else {
    let res = Math.round(absElapsed / msPerYear);
    result += res + " year" + (res !== 1 ? "s" : "");
  }

  if (elapsed >= 0) {
    result += " ago";
  }

  if (result === "0 seconds ago") result = "now";

  return result;
}
