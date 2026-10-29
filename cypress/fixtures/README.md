# Data uji Cypress

Gunakan folder ini untuk data nonrahasia yang dipakai ulang oleh beberapa test.
Saat diperlukan, tambahkan JSON per fitur dan baca menggunakan `cy.fixture()`.
Data kecil yang hanya dipakai satu test boleh tetap berada di spec.

Credential tetap berasal dari `.env`/secret store dan diakses melalui `cy.loginAs(role)`.
Jangan menyimpan akun staging, cookie, token, atau auth storage di fixture.
Data CRUD harus khusus automation, independen, dan mempunyai cleanup.

`schedules/non-repeat.json` mengatur `roomName` dan description untuk TS-017.
Nama Room harus sama dengan opsi pada dropdown; target saat ini `SD 2` sesuai
konfirmasi pengguna.
Waktu mulai dan nama unik dibuat oleh spec; action Turn ON ditetapkan sesuai flow.
