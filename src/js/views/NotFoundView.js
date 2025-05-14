export class NotFoundView {
    render() {
      return `
        <section aria-labelledby="not-found-heading">
          <h2 id="not-found-heading">Halaman Tidak Ditemukan</h2>
          <p>Maaf, halaman yang Anda cari tidak ada.</p>
          <a href="#/home" class="back-btn" aria-label="Kembali ke beranda">
            <i class="fas fa-arrow-left"></i> Kembali ke Beranda
          </a>
        </section>
      `;
    }
  }