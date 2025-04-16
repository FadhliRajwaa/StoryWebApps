// src/views/StoryListView.js
export class StoryListView {
  render() {
    return `
      <section class="story-list-container" aria-labelledby="story-list-heading">
        <h2 id="story-list-heading">Daftar Cerita</h2>
        <div class="story-list" aria-live="polite"></div>
      </section>
    `;
  }

  renderStories(stories) {
    const storyList = document.querySelector('.story-list');
    if (!storyList) {
      console.error('StoryListView: .story-list element not found');
      return;
    }

    if (!Array.isArray(stories) || stories.length === 0) {
      storyList.innerHTML = `
        <p class="no-stories" role="alert">
          Belum ada cerita yang tersedia. Tambah cerita sekarang!
        </p>
      `;
      return;
    }

    storyList.innerHTML = stories.map((story, index) => {
      const mapId = `map-${story.id}-${index}`; // ID unik untuk setiap peta
      return `
        <article class="story-item" role="article">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" loading="lazy" class="story-img"/>
          <div class="story-content">
            <h3 class="story-title">${story.name}</h3>
            <p class="story-desc">Deskripsi: ${story.description.slice(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            <p class="story-date">${new Date(story.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}</p>
            <div id="${mapId}" class="story-map" role="region" aria-label="Lokasi cerita ${story.name}"></div>
            <div class="location" aria-label="Informasi lokasi cerita">
              <p><strong>Koordinat:</strong> ${story.lat && story.lon ? `${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}` : 'Tidak tersedia'}</p>
              <p><strong>Alamat:</strong> <span class="address-text" data-map-id="${mapId}">Memuat alamat...</span></p>
            </div>
            <a href="#/story/${story.id}" class="story-link" aria-label="Lihat detail cerita dari ${story.name}">
              <i class="fas fa-eye"></i> Lihat Detail
            </a>
          </div>
        </article>
      `;
    }).join('');
  }
}