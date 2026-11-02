import test from 'node:test';
import assert from 'node:assert/strict';
import { getScheduleRepeatDays, getScheduleStartTime } from '../cypress/support/scheduleTime.js';

test('repeat memilih besok dan lusa berdasarkan hari WIB', () => {
  assert.deepEqual(getScheduleRepeatDays(Date.parse('2026-11-02T03:00:00Z')), [2, 3]);
});

test('repeat melewati batas minggu dari Jumat ke Sabtu dan Minggu', () => {
  assert.deepEqual(getScheduleRepeatDays(Date.parse('2026-11-06T03:00:00Z')), [0, 6]);
});

test('repeat memakai tanggal WIB saat tanggal UTC masih hari sebelumnya', () => {
  assert.deepEqual(getScheduleRepeatDays(Date.parse('2026-11-07T17:30:00Z')), [1, 2]);
});

test('repeat tetap benar saat pergantian tahun', () => {
  assert.deepEqual(getScheduleRepeatDays(Date.parse('2026-12-31T03:00:00Z')), [5, 6]);
});

test('data Edit/Delete memakai hari berbeda tanpa bergantung pada urutan test', () => {
  const startedAt = Date.parse('2026-11-06T03:00:00Z');
  assert.deepEqual(getScheduleRepeatDays(startedAt, [3]), [1]);
  assert.deepEqual(getScheduleRepeatDays(startedAt, [3, 4]), [1, 2]);
  assert.deepEqual(getScheduleRepeatDays(startedAt, [5, 6]), [3, 4]);
});

test('start time satu jam dari awal test dalam WIB dengan resolusi menit', () => {
  assert.equal(getScheduleStartTime(Date.parse('2026-10-29T03:30:45Z')), '11:30');
});

test('start time mendekati tengah malam tetap menggunakan jam 23', () => {
  assert.equal(getScheduleStartTime(Date.parse('2026-10-29T15:59:59Z')), '23:59');
});

test('menolak pergantian hari WIB sebelum submit karena form tidak memiliki pemilih tanggal', () => {
  assert.throws(() => getScheduleStartTime(Date.parse('2026-10-29T16:30:00Z')), /tanggal lain/);
});

test('menolak tanggal default UTC yang berbeda dengan tanggal target WIB', () => {
  assert.throws(() => getScheduleStartTime(Date.parse('2026-10-29T23:30:00Z')), /tanggal lain/);
});

test('waktu edit dua jam dari awal test lebih lambat dari waktu create satu jam', () => {
  const testStartedAt = Date.parse('2026-10-29T03:30:45Z');
  assert.equal(getScheduleStartTime(testStartedAt), '11:30');
  assert.equal(getScheduleStartTime(testStartedAt, 120), '12:30');
});

test('menolak waktu edit dua jam yang memerlukan tanggal berikutnya', () => {
  assert.throws(
    () => getScheduleStartTime(Date.parse('2026-10-29T15:00:00Z'), 120),
    /tanggal lain/
  );
});
