import { formatTestTimestamp } from './testDataTime.js';

function roomTimestamp(suffix) {
  if (/^\d{13}$/.test(suffix)) {
    return Number(suffix);
  }

  const match = /^(\d{2})(\d{2})(\d{4})-(\d{2})(\d{2})(\d{2})$/.exec(suffix);
  if (!match) return null;

  const [, day, month, year, hour, minute, second] = match;
  const timestamp = Date.parse(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
  return Number.isFinite(timestamp) && formatTestTimestamp(timestamp) === suffix ? timestamp : null;
}

export function getLatestTestRoomName(names, prefix) {
  const rooms = names
    .filter((name) => name.startsWith(prefix))
    .map((name) => ({ name, timestamp: roomTimestamp(name.slice(prefix.length)) }))
    .filter((room) => room.timestamp !== null)
    .sort((first, second) => second.timestamp - first.timestamp);

  if (rooms.length === 0) {
    throw new Error(
      `Room hasil TS-025 dengan prefix "${prefix}" dan timestamp valid tidak tersedia.`
    );
  }
  return rooms[0].name;
}
