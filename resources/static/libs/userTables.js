export const emojis = [
  "🍒", // hsl(0, 35%, 65%)
  "🍊", // hsl(10, 35%, 65%)
  "🍬", // hsl(30, 35%, 65%)
  "🍃", // hsl(120, 35%, 65%)
  // "🧃", // hsl(150, 35%, 65%)
  // "🌊", // hsl(180, 35%, 65%)
  // "🍧", // hsl(200, 35%, 65%)
  "🍇", // hsl(240, 35%, 65%)
  "☔", // hsl(260, 35%, 65%)
  "🌺", // hsl(300, 35%, 65%)
];
export const idToEmoji = (id) => emojis[id % emojis.length];
export const colors = [
  "hsl(0, 35%, 65%)",
  "hsl(10, 35%, 65%)",
  "hsl(30, 35%, 65%)",
  "hsl(120, 35%, 65%)",
  // "hsl(150, 35%, 65%)",
  // "hsl(180, 35%, 65%)",
  // "hsl(200, 35%, 65%)",
  "hsl(240, 35%, 65%)",
  "hsl(260, 35%, 65%)",
  "hsl(300, 35%, 65%)",
];
export const idToColor = (id) => colors[id % colors.length];
