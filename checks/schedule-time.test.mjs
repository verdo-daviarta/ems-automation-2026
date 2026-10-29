import test from 'node:test';
import assert from 'node:assert/strict';
import { getScheduleStartTime } from '../cypress/support/scheduleTime.js';

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
