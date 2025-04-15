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

    // Tangani kasus ketika stories adalah undefined atau bukan array
    if (!Array.isArray(stories) || stories.length === 0) {
      storyList.innerHTML = `
        <p class="no-stories" role="alert">
          Belum ada cerita yang tersedia. Tambah cerita sekarang!
        </p>
      `;
      return;
    }

    storyList.innerHTML = stories.map(story => `
      <article class="story-item" role="article">
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" loading="lazy" class="story-img"/>
        <div class="story-content">
          <h3 class="story-title">${story.name}</h3>
          <p class="story-desc">${story.description.slice(0, 100)}...</p>
          <p class="story-date">${new Date(story.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}</p>
          <a href="#/story/${story.id}" class="story-link" aria-label="Lihat detail cerita dari ${story.name}">
            Lihat Detail
          </a>
        </div>
      </article>
    `).join('');
  }
}