export class StoryListView {
  render(stories) {
    return `
      <section aria-labelledby="stories-heading">
        <h2 id="stories-heading">Cerita Terbaru</h2>
        <div class="story-list">
          ${stories.length ? stories.map(story => `
            <article class="story-item">
              <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" loading="lazy" />
              <div>
                <h3>${story.name}</h3>
                <p>${story.description.slice(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
                <p><small>Dibuat: ${new Date(story.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small></p>
                <a href="#/story/${story.id}" aria-label="Lihat detail cerita oleh ${story.name}">Lihat Detail</a>
              </div>
            </article>
          `).join('') : '<p>Tidak ada cerita untuk ditampilkan.</p>'}
        </div>
      </section>
    `;
  }
}