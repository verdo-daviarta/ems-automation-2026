export function getScheduleStartTime(testStartedAt) {
  const startsAt = new Date(testStartedAt + 60 * 60 * 1000);
  const [date, time] = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  })
    .format(startsAt)
    .split(' ');

  // Form memakai tanggal UTC hari ini dan tidak menyediakan pemilih tanggal.
  if (date !== new Date(testStartedAt).toISOString().slice(0, 10)) {
    throw new Error('Start time +1 jam memerlukan tanggal lain yang belum dapat dipilih di form.');
  }
  return time;
}
