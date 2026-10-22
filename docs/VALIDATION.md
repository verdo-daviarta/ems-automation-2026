# Validasi EMS QA Automation

## FEAT-024 / TS-017 tambah schedule non-repeat — 22 Oktober 2026

Flow sederhana saat ini: login PJ/Admin → menu Schedule → Add schedule → isi
form → verifikasi toggle off dan label `Repeat off` → Add schedule → buka
Upcoming dan cari nama schedule → verifikasi satu baris dengan Room/waktu
sesuai input. Nama unik menggunakan `QA-TS017-<role>-<timestamp>`; durasi
memakai `No end`. Submit disinkronkan dengan POST 201 sebelum pencarian.
Fixture `cypress/fixtures/schedules/non-repeat.json` menyimpan Room, aksi, dan
waktu mulai. Room dan waktu belum ditentukan pengguna, sehingga fixture masih
kosong dan create spec final berstatus **Not Run**. Waktu harus `HH:mm` dan
dipilih di masa mendatang pada hari yang sama untuk tab Upcoming.

Keluhan runner tidak membuka URL direproduksi pada
`2026-10-22T09-27-43-015Z-044b01dc`: kedua test berhenti pada assertion
`roomName` kosong sebelum `cy.loginAs()` dijalankan. `QA_BASE_URL` sudah
`http://ems.10.70.0.45.nip.io`, route Schedule sudah `/schedule`, dan GET
`/login` merespons 200. Urutan spec diperbaiki menjadi login → menu Schedule
→ buka Add schedule → validasi fixture. Fixture kosong tetap menghentikan
submit dengan pesan yang menjelaskan data yang harus diisi.

Run setelah penyesuaian `2026-10-22T09-28-59-664Z-d173c22e`: **0 Pass,
2 Fail** akibat fixture `roomName` kosong. PJ dan Admin berhasil login,
membuka `/schedule` lewat menu, dan menampilkan form Add schedule sebelum
assertion konfigurasi berhenti. Tidak ada submit atau schedule baru. Error
yang direproduksi adalah prasyarat data uji, bukan URL yang belum diisi.

Hook cleanup memeriksa daftar Active dan Upcoming lalu menghapus hanya record
nama/ID milik test, termasuk setelah assertion gagal. Keunikan ID, reload,
End at, konflik jadwal, timezone server, dan eksekusi perangkat tidak termasuk
flow sederhana yang dipilih pengguna.

Pemeriksaan flow terbaru tanpa submit,
`2026-10-22T09-23-39-393Z-d26c95e0`: **2 Pass** untuk PJ/Admin. Menu,
Upcoming, search kosong, pengisian input, radio No end, checkbox unchecked,
dan label `Repeat off` terverifikasi; form ditutup dengan Cancel. Pencarian
cleanup untuk nama yang tidak ada berhasil pada Active/Upcoming. Tidak ada
schedule baru yang disimpan. Submit, pencarian record baru dan penghapusan
melalui hook terbaru belum diverifikasi end-to-end.

Inspeksi staging (build terkonfigurasi `v1.0.5-staging`) mengidentifikasi
route `/schedule` dan backend terpisah
`http://ems-api.10.70.0.45.nip.io/api/schedules`. GET mengembalikan daftar
`body.data.data` beserta metadata pagination; search memakai query `search`,
dan tab Upcoming memakai `status=upcoming`. Form Admin/PJ ditemukan dalam run
`2026-10-22T09-03-07-765Z-72e95faf` tanpa submit yang diteruskan ke server.

Riwayat preflight sebelum penyederhanaan,
`2026-10-22T09-07-56-128Z-664a411f`: **1 Pass, 1 Fail**.
Admin menguji visit, Upcoming, search, field form, serta payload dengan semua
request perubahan diblokir lokal (respons 503 diagnostik). PJ tertahan pada
dashboard yang tidak menampilkan heading. Preflight ini bukan bukti create
schedule berhasil dan tidak dihitung sebagai Pass TS-017.

Pada diagnostik awal, pembatasan intercept ke domain frontend melewatkan
POST ke domain backend sehingga `QA-TS017-inspection-only` sempat tersimpan
pada `test room 2`, aksi off pukul 23:55. Record tersebut sudah dihapus;
run cleanup `2026-10-22T08-59-25-196Z-fa1a9d57` memverifikasi DELETE 204
dan nama tidak ditemukan setelah reload. Diagnostik sesudahnya memblokir
seluruh request perubahan lintas domain. Tidak ada klaim eksekusi perangkat.
Snapshot status manual tetap dipertahankan.

`npm.cmd run check` lulus: 42 file JavaScript valid, 17 unit test lulus, dan
14 Test ID dipetakan. Tidak ada perubahan dependency atau source Playwright.

## FEAT-011 / TS-011 pagination notifikasi — 16 Oktober 2026

Flow saat ini: Admin membuka notifikasi melalui `View all`, memilih `All`,
lalu memilih 10 rows pada halaman 1, 20 rows pada halaman 2, dan 50 rows pada
halaman 3. Setelah memilih ukuran, test memastikan posisi kembali ke halaman 1
sebelum memakai tombol nomor halaman tujuan. Navigasi menunggu respons dan
memeriksa query `page`; tiap kombinasi memeriksa nilai dropdown dan jumlah
baris. Dataset memerlukan minimal 150 notifikasi. Kombinasi diatur melalui
array `paginationCases` pada spec.

Run Cypress staging build `v1.0.5-staging`, role Admin,
`2026-10-16T08-24-42-870Z-def5e0c5`: **1 Pass, 0 Fail**. Halaman 1
menampilkan 10 baris, halaman 2 menampilkan 20 baris, dan halaman 3 menampilkan
50 baris sesuai pilihan dropdown. Pass terbatas pada tiga kombinasi tersebut.

Riwayat flow sebelumnya yang sudah diganti:

Run Cypress staging build `v1.0.5-staging`, role Admin,
`2026-10-16T08-14-40-334Z-746005e7`: **1 Pass, 0 Fail**. Halaman 1-5
masing-masing menampilkan 10 baris sesuai `Rows per page = 10`. Pilihan 20/50
belum dijalankan. `npm.cmd run check` lulus: 40 file JavaScript valid dan
17 unit test lulus. Pass ini hanya untuk subcakupan jumlah baris yang diminta
pengguna; pemeriksaan duplikat/ordering dari flow lama tidak tercakup.

Run Cypress TS-011 pada staging build `v1.0.5-staging`
(`2026-10-16T07-58-48-408Z-4a1c43d2`) menghasilkan **0 Pass, 2 Fail**.
Admin dan PJ masing-masing menampilkan 19 signature `Date`/`Subject`/`Message`
unik dari 20 baris pada halaman 1-2. Alur PJ sudah membuat satu Room uji dan
melihat notifikasi barunya sebelum assertion duplikasi gagal. Navigasi
`Next`/`Prev` dan kembalinya halaman 1 mencapai assertion; assertion urutan
tanggal berada setelah pemeriksaan duplikasi sehingga belum dievaluasi.

Inspeksi baca-saja PJ (`2026-10-16T07-52-29-506Z-17d83ccb`) menemukan 10
baris pada setiap halaman. Navigasi memuat respons `/notification` berformat
Next.js RSC; tidak ada request `/api/notifications` yang teramati dari browser.
Baris identik pada dua halaman adalah duplikasi tampilan. Diagnostik Admin
(`2026-10-16T08-00-29-540Z-14800322`) tidak menemukan ID pada elemen baris;
identitas record backend belum diketahui. Snapshot status manual tidak diubah.

## FEAT-010 / TS-010 filter dan Read All notifikasi — 16 Oktober 2026

Spec Cypress menyiapkan satu notifikasi baru bagi PJ melalui Create Room oleh
Admin, lalu memeriksa `View all`, filter `All` dan `Unread`, serta hasil
`Read All` hingga count unread 0 dan notifikasi tetap ada di `All` setelah
reload. Room uji dipertahankan. Akun Admin belum mendapat test mutasi berulang
karena belum ada aktor lain yang dapat menghasilkan unread Admin secara
deterministik.

Run Cypress TS-010 pada staging build `v1.0.5-staging`
(`2026-10-16T07-23-55-199Z-88dd8235`) gagal sebelum pembuatan Room: setelah
`POST /login` mengembalikan HTTP 200, Admin tetap di `/login`. Diagnostik login
langsung dan `cy.session` (`2026-10-16T07-25-13-757Z-3eaba623`) menunjukkan
kegagalan yang sama. Belum ada assertion TS-010 untuk PJ yang tercapai.

Inspeksi UI terpisah menemukan 16 unread pada Admin dan PJ. Tombol `Read All`
terlihat pada tab `Unread` Admin, tetapi tidak tersedia pada tab tersebut untuk
PJ. Run diagnostik Admin yang disetujui pengguna menandai 16 unread sebagai read
dan memastikan label `Unread (0)`. Jadi UI PJ saat inspeksi belum memenuhi
ekspektasi TS-010, terlepas dari kegagalan login pada run spec. Status manual
snapshot tidak diubah.

## FEAT-045 / TS-025 create Room — 16 Oktober 2026

Spec Cypress Admin mengisi form untuk satu Room bernama
`QA-TS025-admin-<timestamp>`, memeriksa response Create, lalu mencari Room
kembali setelah reload untuk membuktikan data tersimpan. Nama baru dibuat saat
setiap run; Room hasil run dipertahankan. Snapshot TS-025 juga menyebut
duplicate, tetapi AC tidak
menetapkan apakah duplicate harus ditolak atau diizinkan; branch itu belum
diassert. Akun PJ staging pada inspeksi TS-009 sebelumnya tidak memiliki
tombol `Add room`, sehingga create PJ juga belum dicakup.

Run Cypress staging build `v1.0.5-staging` dengan role Admin
`2026-10-16T06-33-46-176Z-099d3482`: **1 Pass, 0 Fail**. Satu Room dengan
nama berpola `QA-TS025-admin-<timestamp>` berhasil dibuat dan tetap tampil
setelah reload. Nama aktual tersedia di log Cypress, tetapi reporter saat ini
hanya menyimpan status test, bukan data Room.

Versi sederhana dengan nama `SD-004` dijalankan pada staging build
`v1.0.5-staging`, role Admin, run `2026-10-16T06-21-35-220Z-38c323f0`:
**1 Pass, 0 Fail**. Room `SD-004` tetap tampil setelah reload. Sesudah run ini,
penamaan statis diganti dengan timestamp; bukti run di atas hanya berlaku untuk
versi sederhana bernama statis.

Implementasi sebelumnya mencari nomor tersedia secara otomatis. Run staging
build `v1.0.5-staging` dengan role Admin
`2026-10-16T04-02-19-048Z-d8872243`: **1 Pass, 0 Fail**. Room `SD-003`
berhasil dibuat dan ditemukan lagi dengan nama persis serta lokasi yang sama
setelah reload. Nama hasil run tercatat dalam
`reports/runs/<run-id>/TS-025-created-room.json`.

Run sebelumnya membuat `SD-001` dan `SD-002`. Run `SD-002` gagal pada selector
automation karena nama dan lokasi tampil dalam sel tabel yang sama; kegagalan
terjadi setelah Create sukses. Selector telah diperbaiki untuk membandingkan
baris nama saja. Di sandbox lokal, proses Cypress gagal sebelum browser dibuka
dengan `ENOMEM`; run yang menghasilkan bukti Pass memakai proses di luar
sandbox. Status manual snapshot tidak diubah.

## FEAT-007 / TS-073 breadcrumb — 16 Oktober 2026

Snapshot TS-073 mengharapkan setiap tautan breadcrumb membuka halaman sesuai
labelnya untuk semua role. Subcakupan Cypress memakai detail Room uji `Server 2`
sebagai halaman bertingkat: `EMS > Rooms > Server 2`, lalu menguji tautan
`Rooms` menuju `/rooms`. Test hanya membaca data Room dan tidak mengubahnya.

Inspeksi DOM pada detail Room di staging build `v1.0.5-staging` menunjukkan
label `EMS` dan `Rooms` adalah elemen `span`; tautan `Back to rooms` tersedia
terpisah dari breadcrumb. Run Chrome terlihat
`2026-10-16T03-18-58-078Z-99d05c50`: **0 Pass, 3 Fail**. Admin mencapai detail
Room dan gagal saat mencari tautan `Rooms` dalam header. PJ terhenti setelah
login pada halaman `System Experiencing Issues`, sedangkan Komandan tetap di
`/login`. Karena itu kegagalan breadcrumb telah dikonfirmasi untuk Admin;
hasil PJ dan Komandan belum membuktikan breadcrumb kedua role tersebut.

Run diagnostik `2026-10-16T03-21-55-711Z-46622bf2` juga **0 Pass, 3 Fail**
karena ketiga role tetap di `/login` setelah percobaan login. Test tidak
mengganti tautan breadcrumb dengan `Back to rooms` untuk membuatnya Pass.
Status manual snapshot tidak diubah. Cakupan tautan `EMS` dan halaman detail
modul lain masih terbuka.

## FEAT-006 / TS-009 assertion pesan Update — 15 Oktober 2026

Pesan update Room pada UI memakai format `Room Name "<nama>", Location
"<lokasi>" has been Updated`, berbeda dari pesan create `Room "<nama>" has
been Created`. Assertion sebelumnya mengharapkan `Room "<nama>" has been
Updated`, sehingga Fail meskipun notifikasi update ada. Assertion sekarang
memastikan baris untuk nama Room unik memuat aksi `Updated`; pesan dari Room
lain tidak dapat meluluskan test.

Run Cypress `--headed` pada staging build `v1.0.5-staging`, ID
`2026-10-15T09-25-54-257Z-97d16c99`: **2 Pass, 0 Fail** untuk subcakupan
Admin Create/Update → PJ dan Komandan tanpa fitur notifikasi. `npm run check`
Pass: 35 file JavaScript, 17 unit test, dan 9 Test ID starter. Room dari run
ini dipertahankan karena Delete ditunda. Admin sebagai penerima, asal badge,
dan push Socket.IO real-time belum teruji. Status manual snapshot tidak diubah.

## FEAT-006 / TS-009 flow CRU — 15 Oktober 2026

Spec Cypress sekarang menjalankan Admin Create Room → PJ memeriksa `Created` →
Admin Update lokasi Room yang sama → PJ memeriksa `Updated`. Komandan diperiksa
tidak mempunyai fitur notifikasi. Delete, termasuk cleanup otomatis, tidak
dijalankan pada fase ini. Room uji memakai nama unik `QA-TS009-admin-<waktu>`
dan dipertahankan untuk fase Delete. Badge diperiksa tampil, tetapi belum
dibuktikan muncul akibat event baru bila sebelumnya sudah ada unread.

Run staging `2026-10-15T07-46-01-505Z-6238fa0b`, build `v1.0.5-staging`:
**1 Pass, 2 Fail** pada versi dua arah. Create Admin berhasil dan PJ melihat
pesan `Created` untuk Room `QA-TS009-admin-1792050372503`. Update lokasi Room
berhasil (`PATCH 200`, lokasi baru tampil di daftar), tetapi pesan `Updated`
tidak ditemukan pada daftar notifikasi PJ. Pengecekan Komandan tanpa fitur
notifikasi Pass. Room uji tersebut tetap ada sesuai fase CRU tanpa Delete.

Percobaan PJ sebagai aktor gagal sebelum Create: halaman Rooms PJ tidak
menampilkan tombol `Add room` maupun `Edit`. Pemeriksaan read-only Komandan
`2026-10-15T07-48-07-800Z-89dd8f6e` juga tidak menemukan `Add room`; role
tersebut hanya memiliki tindakan lihat. Akun `user` dengan izin CRU Room belum
dikonfigurasi. Karena itu arah menuju Admin sebagai penerima dikeluarkan dari
spec aktif sampai aktor lain tersedia. Pada run tersebut, kegagalan `Updated`
tetap dicatat sebagai Fail sampai format pesan UI yang sebenarnya dibuktikan.
Status manual snapshot tidak diubah.

## Riwayat FEAT-006 / TS-009 flow CRUD sebelumnya — 15 Oktober 2026

Target `http://ems.10.70.0.45.nip.io/`, build `v1.0.5-staging`.
Spec Cypress baru menguji CRUD Room dengan nama unik dari `admin` ke `pj` dan
sebaliknya, memeriksa tiga pesan pada daftar notifikasi setelah penerima login,
serta memastikan `komandan` tidak mempunyai fitur notifikasi. Cakupan awal ini
belum membuktikan push Socket.IO saat penerima tetap online.

Run staging `2026-10-15T04-13-14-380Z-6b0a06d9` berakhir dengan 0 Pass,
2 Fail, 1 Skipped sebelum mencapai assertion notifikasi: Admin berhasil
Create, Update (`PATCH 200`), dan Delete Room uji,
tetapi login PJ berakhir pada halaman `System Experiencing Issues`. Login PJ
berikutnya tetap di `/login` meskipun request `/login` merespons `200`.
Percobaan cleanup terpisah `2026-10-15T04-15-00-001Z-87888f34` juga tertahan
karena login Admin tetap di `/login`. Browser yang sudah memiliki sesi Admin
menampilkan halaman error yang sama. **Status TS-009: Blocked**, bukan Pass;
hasil manual pada snapshot tidak diubah.

Room `QA-TS009-admin-1792037443356` dibuat pada run diagnostik pertama dan
belum dapat dipastikan terhapus. Catat nama persis ini untuk fase Delete nanti;
jangan hapus pada fase CRU saat ini. Hook cleanup dari versi lama telah dihapus
dari spec aktif.

Pemeriksaan akhir `npm run check` **Pass** (35 file JavaScript, 17 unit test,
9 Test ID pada mapping). Regresi Cypress demo saja, run
`2026-10-15T04-18-07-727Z-e03528df`, **8 Pass, 4 Pending**; tiga test TS-009
Pending karena memang khusus staging. Playwright tidak dijalankan.

## Konsistensi kode dan TS-004 — 15 Oktober 2026

Spec dan Page Object diseragamkan: Page Object dibuat per test, tindakan login
bersama tetap di helper, sedangkan assertion hasil skenario terlihat di spec.
UI demo dipisah dari server ke file HTML, CSS, dan JavaScript agar kode browser
diperiksa sintaks serta formatnya bersama source lain.

Sebelum perbaikan, TS-004 pada demo gagal karena assertion percobaan pertama
justru mengharapkan akun sudah terkunci dan assertion akhir mengharapkan pesan
penguncian tidak cocok. Setelah assertion dikembalikan sesuai skenario, target
`demo`, build `framework-demo-v1`, run
`2026-10-15T03-11-01-122Z-a9a51ff6`: Cypress TS-004 **Pass 1/1** dengan akun
fiktif. `npm run check` lulus (32 file JavaScript, 17 unit test, mapping 8 Test
ID). Regresi demo `2026-10-15T03-14-22-454Z-12e5b5d1`: Cypress **8 Pass** dan
TS-004 **Pending** tanpa opt-in; Playwright yang sudah ada **5 Pass**. Tidak ada
implementasi TS-004 di Playwright. Staging tidak dijalankan karena dapat
mengunci akun `komandan`; perbedaan format toast staging yang tercatat di bawah
belum terselesaikan.

## FEAT-004 / TS-004 Pending di Cypress Open — 14 Oktober 2026

Status Pending pada runner interaktif berasal dari `it.skip` saat
`QA_RUN_RATE_LIMIT` tidak disetel di proses yang membuka Cypress. Spec kini
mengaktifkan TS-004 saat `Cypress.config('isInteractive')` bernilai true;
run headless tetap memerlukan `QA_RUN_RATE_LIMIT=1` agar tidak mengunci akun
secara tidak sengaja.

`npm run check` lulus (29 file JavaScript, 16 unit test, mapping 8 Test ID).
Target demo `framework-demo-v1`, run `2026-10-14T07-57-11-386Z-cf8336b2`:
TS-004 Cypress headless dengan flag **Pass 1/1, Pending 0**. Regresi demo
`2026-10-14T08-00-49-389Z-ed87036c`: Cypress **8 Pass, TS-004 Pending 1**
tanpa flag, Playwright **5 Pass**. Jendela Cypress Open yang dipakai pengguna
tidak terhubung ke alat inspeksi browser pada sesi ini, sehingga perilaku
interaktif setelah perubahan belum dapat dikonfirmasi langsung. Staging tidak
diulang karena akun `komandan` dapat masih terkunci; temuan toast staging di
bawah tetap terbuka.

## FEAT-004 / TS-004 toast bertanggal — 14 Oktober 2026

Target staging `http://ems.10.70.0.45.nip.io/`, build `v1.0.5-staging`, role
`komandan`, run `2026-10-14T07-25-39-720Z-ffd1a77b`: **Fail 1/1**. Test
melakukan 21 submit password salah dan tidak menemukan toast dengan expected
result `Akun terkunci. Silakan coba lagi dd mmm yyyy, hhmm`. Satu percobaan
diagnostik setelah akun terkunci, run `2026-10-14T07-28-33-324Z-f2699f51`,
menampilkan toast `Terlalu banyak percobaan login, coba lagi nanti`.
Pesan saat transisi tepat pada percobaan ke-21 belum tertangkap secara terpisah.

Assertion akhir kini menyimpan teks toast terakhir pada pesan kegagalan untuk
memudahkan diagnosis. Versi akhir spec lulus pada demo lokal, run
`2026-10-14T07-33-28-787Z-a60053fc` (**Pass 1/1**), dan `npm run check` lulus
(29 file JavaScript, 16 unit test). Staging belum diulang dengan versi akhir
karena akun `komandan` sedang terkunci. Hasil Pass sebelumnya di bawah memakai
assertion kata `akun terkunci` yang lebih longgar dan tidak membuktikan format
tanggal/jam yang sekarang diminta.

## FEAT-004 / TS-004 Cypress staging — 14 Oktober 2026

Target `http://ems.10.70.0.45.nip.io/`, build `v1.0.5-staging`, role
`komandan`, run `2026-10-14T06-44-12-133Z-a2300fe8`: **Pass 1/1**.
Spec Cypress mengirim 21 percobaan login UI dengan password salah, menunggu
request server action `/login` pada setiap percobaan, lalu memverifikasi pesan
akun terkunci terlihat. Credential asli tidak dikirim oleh spec ini. Akun
`komandan` dapat tetap terkunci setelah run; proses dan durasi pemulihan belum diuji.
Status manual pada snapshot tidak diubah. Hasil ini hanya membuktikan subcakupan
yang tercatat di `catalog/automation-map.json` pada build tersebut.

Demo terpisah `framework-demo-v1`, run
`2026-10-14T06-43-38-847Z-c4e06872`: Cypress TS-004 **Pass 1/1** dengan akun
fiktif. `npm run check` lulus (29 file JavaScript, 16 unit check, mapping 8 Test ID).
Regresi Cypress demo standar pada run `2026-10-14T06-46-10-890Z-b823b47e`
memberi 8 Pass dan TS-004 Pending tanpa flag opt-in. Playwright tidak dijalankan
untuk pekerjaan TS-004.

## Cypress Open staging: reload berulang — 13 Oktober 2026

Saat `login.cy.js` dipilih dalam Chrome interaktif, runner berpindah berulang dari
origin HTTP staging ke HTTPS. DevTools mencatat redirect internal `307` dengan
`Non-Authoritative-Reason: HttpsUpgrades`; 90 navigasi terjadi dalam 7 detik,
sementara Cypress tetap melaporkan `spec not selected`. Endpoint HTTP `/login`
sendiri merespons `200`, tanpa redirect server.

`cypress.config.js` sekarang menambahkan hanya hostname staging HTTP ke preferensi
Chrome `https_upgrades.policy.http_allowlist` lewat `before:browser:launch`.
Setelah browser diluncurkan ulang, `login.cy.js` selesai 4/4 Pass melalui
`npm run cy:open` dan melalui `npx cypress open` setelah variabel
`ELECTRON_RUN_AS_NODE` dibersihkan dari terminal. Status Cypress tetap `passed`
setelah run. `npm run check` lulus (26 file sintaks, 16 checks, catalog), dan
`npm run test:demo` lulus (Cypress 8/8, Playwright 5/5).

Pembuktian ini terbatas pada TS-001 tiga role dan TS-002 dalam spec login.
Kegagalan TS-006 (`NEXT_REDIRECT`) dan TS-046 (menu mobile belum dibuka oleh test)
dari run staging sebelumnya belum diperbaiki di sini. TS-003 tetap Not Run.
Snapshot status manual tidak diubah.

## Riwayat inspeksi awal staging — 13 Oktober 2026

Target: `http://ems.10.70.0.45.nip.io/`. Build ID: `v1.0.5-staging`, berdasarkan
[release yang diberikan pengguna](https://git.falahtech.com/2026/fe-energy-management-system/-/releases/v1.0.5-staging).
Nomor release ini dicatat dari pengguna; teks branding login masih menampilkan
`EMS Enterprise v0.1` dan tidak dipakai untuk menggantikan release tersebut.

`.env` sekarang memakai `QA_TARGET=staging`, URL dan build ID di atas, serta
`QA_ROLES=admin,pj,komandan`. Credential yang sudah tersedia dipertahankan.
Adapter menerima `QA_<ROLE>_ID`, dengan fallback `_USERNAME` lalu `_EMAIL`.
Demo tetap memakai akun fiktif `admin,pj,user`.

Kontrak UI direview dari DOM login/dashboard dan script publik aplikasi yang telah
teramati pada browser. Field login bernama `username`/`password`, toggle berlabel
Show/Hide password, logout memiliki ikon lucide-log-out, dan route login/dashboard
adalah `/login`/`/dashboard`. Selector validasi `aria-invalid=true` berasal dari
rendering form pada source; submit kosong belum diverifikasi pada runtime.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run doctor` | Pass: target/build/roles dikenali; tidak membuktikan login |
| `npm run check` | Pass: 26 file sintaks valid, 16 checks, catalog mapping |
| Demo regresi | Cypress 8/8 dan Playwright 5/5 Pass; exit code 0 |
| Staging TS-072, Chrome headless | 1/1 Pass: type password/text/password dan nilai terjaga |
| Staging TS-071, Chromium headless | 3/3 Pass: layout login 320/768/1280 px |
| Staging TS-001/TS-002/TS-006/TS-046 | Suite belum dijalankan; inspeksi login baru terhalang Turnstile |
| Staging TS-003 API | Not Run; kontrak API disabled |

Run evidence:

- Demo `framework-demo-v1`: `2026-10-13T04-27-56-193Z-f97991d2`.
- Staging `v1.0.5-staging`, TS-071: `2026-10-13T04-28-07-470Z-7f1141d7`.
- Staging `v1.0.5-staging`, TS-072: `2026-10-13T04-29-24-568Z-fa5971b8`.

Hasil staging di atas tidak memakai session terautentikasi. Roles dalam metadata
adalah daftar konfigurasi; bukan bukti login ketiga role berhasil. Pass pada mapping
TS-071/TS-072 hanya berlaku untuk implementedScope dan build/run yang dicatat.
Snapshot manual tidak diubah.

Browser inspeksi awal memiliki session admin yang sudah aktif. Dashboard serta
redirect logout ke `/login` diamati dari session itu, bukan dari login baru akun QA.
Setelah field QA diisi pada halaman login, Sign In tetap disabled. Script login
menunjukkan kondisi disabled selama proses sign-in atau saat token Turnstile belum
tersedia. Penyebab Turnstile belum siap belum ditentukan. Tidak ada CAPTCHA bypass,
forced click, mock token, atau klaim login staging Pass. Credential dibersihkan dari
field setelah inspeksi.

Endpoint login saat ini ditangani server action pada source frontend; belum ada
kontrak JSON API yang cukup untuk mengaktifkan adapter TS-003. Mobile navigation dan
dashboard setiap role juga belum diverifikasi melalui login baru.

Konfigurasi siap dibaca runner. Automasi authentication memerlukan Turnstile yang
siap pada lingkungan QA dan kontrak/expected result terbaru. Cypress berjalan di
luar sandbox dengan approval karena pembatasan akses profil Windows. Tidak ada
perubahan data bisnis, jadwal/CI, commit, atau push pada pekerjaan konfigurasi ini.

## Migrasi ke JavaScript — 13 Oktober 2026

Source automation dan config runner menggunakan JavaScript ES Modules. Helper CommonJS
(.cjs) dan script Node (.mjs) tetap digunakan. Deklarasi tipe, tsconfig, dan dependency
langsung TypeScript/@types/node dihapus; jsconfig.json hanya untuk dukungan editor.

Environment: Windows 10, Node.js 22.23.2, npm 10.9.8. Versi Cypress 16.1.1,
Playwright Test 1.64.0, dan dotenv 17.2.3 tetap sama. Tidak ada dependency baru.

| Pemeriksaan | Hasil |
| --- | --- |
| npm run check | Pass: sintaks 26 file, 13 checks, dan catalog mapping |
| Import relatif JavaScript | Seluruh path source yang diperiksa ditemukan |
| Reporter JavaScript | Pass: discovery tanpa summary, status/TS ID/metadata/artifact tersimpan tanpa credential |
| Cypress demo, Electron headless | 8/8 Pass pada 3 spec .cy.js |
| Playwright demo, Chromium headless | 5/5 Pass: API, mobile, responsive pada .spec.js |
| npm run test:demo | Exit code 0; kedua runner selesai |
| Catalog | 123 skenario; 7 Test ID subcakupan; 116 belum diimplementasi |
| EMS staging | Not Run |

Run berhasil: 2026-10-13T03-17-26-395Z-e9603a07.
Laporan: reports/runs/2026-10-13T03-17-26-395Z-e9603a07/.
Target demo, build framework-demo-v1:

- Cypress TS-001/TS-006: admin, pj, user; TS-002/TS-072: login tanpa session.
- Playwright TS-003/TS-046: role pertama (admin); TS-071: layout login tanpa session
  pada 320/768/1280 px.

Percobaan sandbox gagal saat Cypress membaca profil Windows (uv_os_get_passwd
returned ENOMEM). Full demo kemudian lulus di luar sandbox dengan approval.
Tidak ada perubahan assertion untuk menutupi error, tambahan retry, atau fixed wait.

Snapshot skenario, kontrak demo/staging, shared settings/reporting, script runner,
dan .env dibandingkan dengan baseline dan tetap identik. Mapping hanya mengubah
path .ts menjadi .js; status manual dan stagingVerification tidak berubah.
README/panduan memakai path JavaScript; byte NUL pada ekor README yang berasal dari
campuran encoding dibersihkan saat pembaruan dokumentasi.

Pemeriksaan sintaks menggantikan type checking; tidak lagi ada pembuktian tipe
parameter sebelum runtime. Guard konfigurasi tetap berjalan. Demo Pass hanya
membuktikan framework pada aplikasi fiktif, bukan EMS staging atau perangkat nyata.

Catatan berikut adalah riwayat sebelum migrasi; hasil TypeScript bukan pemeriksaan
terkini untuk source JavaScript.

### Riwayat verifikasi TypeScript — Verifikasi paket — 9 Oktober 2026

Verifikasi awal paket dilakukan pada Node.js 24.19.0 dan npm 11.9.0, Linux. Pada saat itu paket belum diuji pada Windows. Verifikasi struktur baru di Windows dicatat di bawah; EMS staging tetap belum dijalankan karena URL, credential, route, dan selector belum tersedia.

### Verifikasi struktur baru di Windows — 9 Oktober 2026

#### Retest setelah perbaikan Problems dan runner

Error `TS5055` berhasil direproduksi pada konfigurasi Cypress dan Playwright:
TypeScript mencoba menulis `shared/reporting.cjs` ke lokasi input. `npm run check`
lama lulus karena CLI memakai `--noEmit`, sedangkan editor membaca konfigurasi
yang belum memiliki opsi tersebut. Error deprecation `moduleResolution=node10`
berasal dari pesan Problems yang diberikan pengguna; dependency project masih
TypeScript 5.9.3, sehingga deprecation TypeScript 6 tidak muncul pada CLI lama.

Perbaikan:

- `noEmit: true` di config dasar; resolusi modul menggunakan pasangan `Node16`.
- Config root eksplisit untuk config runner/shared types; config per runner tetap terpisah.
- Check baru menggunakan language server dependency project untuk memeriksa project
  ownership, compiler options, serta diagnostik sintaks/semantik pada 14 file.
- Runner melepas `ELECTRON_RUN_AS_NODE` hanya dari child process Cypress.

Validasi ulang:

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | Pass: tiga konfigurasi TypeScript, 12 checks, dan catalog |
| Diagnostik compiler options root/Cypress/Playwright | Tidak ada error; `noEmit=true`, module/resolution `Node16` |
| Language server dependency project | Tidak ada error pada 14 file yang diperiksa; project ownership sesuai |
| `npm run test:demo` tanpa workaround manual | Pass: Cypress 8/8 dan Playwright 5/5; exit code 0 |
| EMS staging | Not Run |

Run: `2026-10-09T09-01-10-071Z-40de946b`, target `demo`, build `framework-demo-v1`.
TS ID dan cakupan role sama dengan struktur awal di bawah. Environment parent masih
memiliki `ELECTRON_RUN_AS_NODE=1`; hanya child Cypress yang menerima environment
tanpa variabel itu. Sandbox tetap menghalangi akses profil Windows, sehingga run
browser dilakukan di luar sandbox dengan approval. Panel Problems VS Code tidak
dapat dibaca langsung karena koneksi computer-use tidak tersedia; diagnostik
pengguna dan language server project menjadi bukti verifikasi.

#### Verifikasi pertama struktur baru

Environment: Windows 10, Node.js 22.23.2, npm 10.9.8. Dependency dipasang melalui `npm ci` dari lockfile yang sama; Chromium Playwright dipasang. `npm run setup` membuat `.env` mode demo.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | Pass: TypeScript kedua runner, 11 checks, dan catalog mapping |
| Cypress demo, Electron headless | 8/8 Pass pada 3 spec authentication |
| Playwright demo, Chromium headless | 5/5 Pass: API, mobile, responsive |
| `npm run test:demo` | Exit code 0; kedua runner selesai |
| Catalog | 123 skenario; 7 Test ID subcakupan; 116 belum diimplementasi |
| Review perubahan | Snapshot, kontrak staging, dependency/lockfile, dan konfigurasi kedua runner identik dengan baseline |
| EMS staging | Not Run |

Run berhasil: `2026-10-09T08-19-58-632Z-42b9bf2d`.
Metadata dan hasil berada di `reports/runs/2026-10-09T08-19-58-632Z-42b9bf2d/`.
Target `demo`, build `framework-demo-v1`:

- Cypress TS-001/TS-006: admin, pj, user; TS-002 dan TS-072: login tanpa session.
- Playwright TS-003/TS-046: role pertama (admin); TS-071: layout login tanpa session pada 320/768/1280 px.

Percobaan awal Cypress gagal sebelum assertion dengan `bad option: --smoke-test` karena sesi menjalankan `ELECTRON_RUN_AS_NODE=1`. Setelah variabel itu dilepas pada proses verifikasi, sandbox masih menghalangi pembacaan profil Windows (`uv_os_get_passwd returned ENOMEM`). Run berhasil dilakukan di luar sandbox dengan approval, tanpa mengubah konfigurasi Windows atau menambahkan suppression/retry ke test.

Pada verifikasi pertama, variabel tersebut dilepas sementara melalui PowerShell.
Sesudah perbaikan runner di atas, cukup jalankan `npm run test:demo`; runner menangani
environment child Cypress. Variabel tersebut mengubah Electron menjadi proses Node.js
([Electron environment variables](https://www.electronjs.org/docs/latest/api/environment-variables)).

Demo Pass membuktikan struktur framework dan assertion terhadap aplikasi fiktif. Ini tidak memperluas subcakupan, mengubah status manual, atau membuktikan EMS staging/perangkat nyata.

### Verifikasi awal paket di Linux

| Pemeriksaan | Hasil |
| --- | --- |
| Dependency npm dan package-lock | Terpasang; `npm ci --ignore-scripts --dry-run` lulus |
| TypeScript Cypress dan Playwright | Lulus |
| Unit/integration checks konfigurasi, demo HTTP, dan reporter | Lulus, 11 checks |
| Catalog dan mapping | 123 skenario; starter 7 Test ID; backlog 116 |
| Playwright discovery | 5 test instance ditemukan pada 3 spec |
| Playwright API demo TS-003 | Pass |
| Playwright mobile/responsive demo | Blocked: executable Chromium belum tersedia |
| Cypress UI demo | Runner tidak dapat mulai: executable Cypress belum tersedia |
| Smoke terhadap EMS staging | Not Run |

Sumber download binary Cypress dan Chromium mengembalikan halaman HTML “Site Unavailable”, bukan arsip ZIP. Ini membuat pemasangan binary browser tidak dapat diselesaikan dari lingkungan pengembangan ini. Paket npm, type checking, demo HTTP, serta tes API tetap dapat diverifikasi.

Full demo telah dicoba: API berjalan, sedangkan 4 instance UI Playwright berhenti pada launch browser sebelum assertion aplikasi. Runner mengembalikan exit code nonzero. Tidak ada hasil tersebut yang dipakai untuk mengubah status manual atau RTM.

### Verifikasi pada laptop

Setelah browser terpasang:

```powershell
npm ci
npm run setup
npx cypress verify
npx playwright install chromium
npm run check
npm run test:demo
```

Expected discovery demo: 8 instance Cypress dan 5 instance Playwright. Hasil lulus baru dapat dinyatakan setelah test benar-benar dijalankan di lingkungan itu.

Jika jaringan lokal juga menghalangi binary, pemeriksaan non-browser masih bisa dijalankan dengan langkah berikut pada PowerShell:

```powershell
$env:CYPRESS_INSTALL_BINARY = '0'
npm ci
Remove-Item Env:CYPRESS_INSTALL_BINARY
npm run setup
npm run check
npm run pw:run -- --project=api
```

Untuk menyelesaikan verifikasi UI setelah akses download tersedia, jalankan `npx cypress install`, `npx cypress verify`, `npx playwright install chromium`, lalu `npm run test:demo`.

Setelah konfigurasi staging direview, lanjutkan run pada build EMS yang diketahui. Mode demo memakai Electron bawaan Cypress untuk verifikasi framework; suite staging menggunakan Chrome sesuai `.env`. Playwright demo memakai Chromium; `QA_PLAYWRIGHT_CHANNEL=chrome` memilih Chrome terpasang untuk staging.
