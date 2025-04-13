// src/views/StoryDetailView.js
export class StoryDetailView {
  render(story) {
    const locationText = story.lat && story.lon
      ? `Lokasi: ${parseFloat(story.lat).toFixed(6)}, ${parseFloat(story.lon).toFixed(6)}`
      : 'Lokasi tidak tersedia';

    return `
      <section class="story-detail" aria-labelledby="story-detail-heading">
        <h2 id="story-detail-heading" class="sr-only">Detail Cerita</h2>
        <a href="#/home" class="back-btn" aria-label="Kembali ke beranda">
          <i class="fas fa-arrow-left"></i> Kembali
        </a>
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" loading="lazy" />
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <p class="meta">Dibuat: ${new Date(story.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div id="map" role="region" aria-label="Lokasi cerita"></div>
        <p class="location" aria-label="Koordinat lokasi">${locationText}</p>
      </section>
    `;
  }
}