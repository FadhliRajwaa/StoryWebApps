// src/js/views/SavedStoriesView.js
export class SavedStoriesView {
    render() {
      return `
        <section class="saved-stories-container" aria-labelledby="saved-stories-heading">
          <h2 id="saved-stories-heading">Cerita Tersimpan</h2>
          <div class="saved-stories-list" aria-live="polite"></div>
        </section>
      `;
    }
  
    renderStories(stories) {
      const storyList = document.querySelector('.saved-stories-list');
      if (!storyList) {
        console.error('SavedStoriesView: .saved-stories-list element not found');
        return;
      }
  
      if (!Array.isArray(stories) || stories.length === 0) {
        storyList.innerHTML = `
          <p class="no-stories" role="alert">
            Belum ada cerita tersimpan. Tambah cerita atau muat dari server!
          </p>
        `;
        return;
      }
  
      storyList.innerHTML = stories.map((story, index) => {
        const mapId = `saved-map-${story.id}-${index}`;
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
              <button class="delete-story-btn" data-id="${story.id}" aria-label="Hapus cerita ${story.name} dari penyimpanan lokal">Hapus</button>
              <a href="#/story/${story.id}" class="story-link" aria-label="Lihat detail cerita dari ${story.name}">
                <i class="fas fa-eye"></i> Lihat Detail
              </a>
            </div>
          </article>
        `;
      }).join('');
    }
  }