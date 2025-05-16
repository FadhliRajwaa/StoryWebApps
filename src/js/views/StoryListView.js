export class StoryListView {
  render() {
    return `
      <section class="story-list-container" aria-labelledby="story-list-heading">
        <h2 id="story-list-heading" class="sr-only">Daftar Cerita</h2>
        
        <div id="offline-indicator" class="offline-indicator" style="display: none;">
          <i class="fas fa-wifi"></i>
          <span>Anda sedang offline. Menampilkan data dari cache.</span>
        </div>
        
        <div class="notification-container">
          <button id="subscribe-button" class="notification-btn">
            <i class="fas fa-bell"></i> Langganan Notifikasi
          </button>
          <a href="#/favorites" class="notification-btn favorites-link">
            <i class="fas fa-heart"></i> Lihat Favorit
          </a>
        </div>
        <div class="favorite-container">
          <button id="show-all-btn" class="filter-btn active">Semua Cerita</button>
          <button id="show-favorites-btn" class="filter-btn">Cerita Favorit</button>
        </div>
        <div class="story-list" aria-live="polite"></div>
      </section>
    `;
  }

  renderStories(stories, favorites = []) {
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

    // Convert favorites array to a Set for faster lookup
    const favoriteIds = new Set(favorites.map(fav => fav.id));

    storyList.innerHTML = stories.map((story, index) => {
      const mapId = `map-${story.id}-${index}`;
      const isFavorite = favoriteIds.has(story.id);
      return `
        <article class="story-item" role="article" data-story-id="${story.id}">
          <div class="story-img-container">
            <img src="${story.photoUrl || '/src/assets/placeholder.jpg'}" alt="Foto cerita oleh ${story.name}" loading="lazy" class="story-img" />
          </div>
          <div class="story-content">
            <h3 class="story-title">${story.name}</h3>
            <p class="story-desc">${story.description.slice(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            <p class="story-date">${new Date(story.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}</p>
            <div class="story-actions">
              <button class="delete-cache-btn" aria-label="Hapus cerita ${story.name} dari cache">
                <i class="fas fa-trash-alt"></i> Hapus dari Cache
              </button>
              <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" aria-label="${isFavorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}" data-story-id="${story.id}">
                <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart'}"></i> ${isFavorite ? 'Favorit' : 'Favoritkan'}
              </button>
              <a href="#/story/${story.id}" class="story-link" aria-label="Lihat detail cerita dari ${story.name}">
                <i class="fas fa-eye"></i> Lihat Detail
              </a>
            </div>
          </div>
          <div id="${mapId}" class="story-map" role="region" aria-label="Lokasi cerita ${story.name}"></div>
          <div class="location" aria-label="Informasi lokasi cerita">
            <p><strong>Koordinat:</strong> ${story.lat && story.lon ? `${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}` : 'Tidak tersedia'}</p>
            <p><strong>Alamat:</strong> <span class="address-text" data-map-id="${mapId}">Memuat alamat...</span></p>
          </div>
        </article>
      `;
    }).join('');
  }
}