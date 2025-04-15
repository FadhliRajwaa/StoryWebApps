export class StoryDetailView {
  render(story) {
    return `
      <section class="story-detail" aria-labelledby="story-detail-heading">
        <h2 id="story-detail-heading" class="sr-only">Detail Cerita</h2>
        <a href="#/home" class="back-btn" aria-label="Kembali ke beranda">
          <i class="fas fa-arrow-left"></i> Kembali
        </a>
        <div class="loading" id="loading" style="display: none;" aria-live="polite">
          Memuat detail cerita...
        </div>
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" loading="lazy" />
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <p class="meta">Dibuat: ${new Date(story.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div id="map" role="region" aria-label="Lokasi cerita"></div>
        <div class="location" aria-label="Lokasi cerita">
          <p><strong>Koordinat:</strong> ${story.address.coordinates}</p>
          <p><strong>Alamat Detail:</strong> ${story.address.details}</p>
        </div>
      </section>
    `;
  }
}