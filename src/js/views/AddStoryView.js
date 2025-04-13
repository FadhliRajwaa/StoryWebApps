// src/views/AddStoryView.js
export class AddStoryView {
  render() {
    return `
      <section aria-labelledby="add-story-heading">
        <h2 id="add-story-heading">Tambah Cerita Baru</h2>
        <form id="add-story-form" enctype="multipart/form-data">
          <label for="description">Deskripsi Cerita</label>
          <textarea id="description" name="description" required aria-required="true" placeholder="Ceritakan kisah Anda..."></textarea>

          <label for="photo">Pilih Foto</label>
          <input type="file" id="photo" name="photo" accept="image/*" aria-required="true" />
          <img id="photo-preview" style="display: none;" alt="Pratinjau foto yang akan diunggah untuk cerita baru" />

          <label for="start-camera">Gunakan Kamera</label>
          <button type="button" id="start-camera" aria-controls="video">Buka Kamera</button>
          <video id="video" style="display: none;" autoplay playsinline aria-hidden="true"></video>
          <canvas id="canvas" style="display: none;" aria-hidden="true"></canvas>

          <label for="map">Pilih Lokasi</label>
          <div id="map" role="region" aria-label="Peta untuk memilih lokasi cerita"></div>
          
          <div class="map-controls">
            <button type="button" id="clear-marker-btn" class="clear-marker-btn">Hapus Marker</button>
          </div>

          <input type="hidden" id="lat" name="lat" aria-hidden="true" />
          <input type="hidden" id="lon" name="lon" aria-hidden="true" />

          <button type="submit">Tambah Cerita</button>
        </form>
        <!-- Pindahkan radio button ke luar form -->
        <div class="map-style-selector" role="radiogroup" aria-label="Pilih gaya peta">
          <label>
            <input type="radio" name="style-selector" value="MapTiler Streets" checked>
            MapTiler Streets
          </label>
          <label>
            <input type="radio" name="style-selector" value="MapTiler OpenStreetMap">
            MapTiler OpenStreetMap
          </label>
        </div>
      </section>
    `;
  }
}