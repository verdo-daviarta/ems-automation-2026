# Data uji Cypress

Gunakan folder ini untuk data nonrahasia yang dipakai ulang oleh beberapa test.
Saat diperlukan, tambahkan JSON per fitur dan baca menggunakan `cy.fixture()`.
Data kecil yang hanya dipakai satu test boleh tetap berada di spec.

Credential tetap berasal dari `.env`/secret store dan diakses melalui `cy.loginAs(role)`.
Jangan menyimpan akun staging, cookie, token, atau auth storage di fixture.
Data CRUD harus khusus automation. Cleanup mengikuti cakupan skenario; Schedule
Create/Edit dipertahankan sesuai permintaan pengguna, dengan Delete pada spec tersendiri.

`schedules/non-repeat.json` mengatur `roomNamePrefix` dan description untuk TS-017.
`schedules/repeat.json` mengatur kedua field tersebut untuk TS-019 / FEAT-027.
Prefix `QA-TS025-admin-` memilih Room hasil TS-025 terbaru berdasarkan timestamp
pada nama di opsi Choose room. Room harus sudah tersedia dan dapat diakses role.
Waktu mulai dan nama unik dibuat oleh spec; action Turn ON ditetapkan sesuai flow.
