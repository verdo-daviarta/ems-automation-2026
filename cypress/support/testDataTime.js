export function formatTestTimestamp(timestamp = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));
  const { day, month, year, hour, minute, second } = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${day}${month}${year}-${hour}${minute}${second}`;
}
