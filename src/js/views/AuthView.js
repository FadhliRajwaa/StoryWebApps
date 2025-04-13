// src/views/AuthView.js
export class AuthView {
  renderLogin() {
    return `
      <section aria-labelledby="login-heading">
        <h2 id="login-heading">Masuk ke Story App</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="Masukkan email Anda" autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Kata Sandi</label>
            <input type="password" id="password" name="password" required placeholder="Masukkan kata sandi Anda" autocomplete="current-password">
          </div>
          <button type="submit">Masuk</button>
        </form>
        <p class="register-link">
          Belum punya akun? <a href="#/register" id="register-link">Daftar di sini</a>
        </p>
      </section>
    `;
  }

  renderRegister() {
    return `
      <section aria-labelledby="register-heading">
        <h2 id="register-heading">Daftar ke Story App</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" required placeholder="Masukkan nama Anda" autocomplete="name">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="Masukkan email Anda" autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Kata Sandi</label>
            <input type="password" id="password" name="password" required placeholder="Masukkan kata sandi Anda" autocomplete="new-password">
          </div>
          <button type="submit">Daftar</button>
        </form>
      </section>
    `;
  }
}