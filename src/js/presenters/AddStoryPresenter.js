import { StoryModel } from '../models/StoryModel.js';
import { AddStoryView } from '../views/AddStoryView.js';
import { initMap, addMarker, clearMarkers } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';
import router from '../utils/router.js';

export class AddStoryPresenter {
  constructor() {
    this.model = new StoryModel();
    this.view = new AddStoryView();
    this.markers = [];
    this.map = null;
    this.stream = null;
    this.isPhotoCaptured = false;
    this.lastClickedLocation = null;
    this.isProcessingClick = false; // State untuk mencegah klik ganda
    this.init();
  }

  init() {
    console.log('AddStoryPresenter: Initializing...');
    if (!Auth.isAuthenticated()) {
      console.log('AddStoryPresenter: User not authenticated, redirecting to login');
      showToast({ message: 'Silakan login untuk menambahkan cerita.', type: 'warning' });
      router.navigateTo('#/login');
      return;
    }

    document.getElementById('app').innerHTML = this.view.render();
    this.setupMap();
    this.setupCamera();
    this.setupForm();
  }

  async setupMap() {
    this.map = initMap('map', {
      center: [106.8456, -6.2088],
      zoom: 10,
      style: 'MapTiler Streets',
    });
    if (!this.map) {
      console.warn('Map initialization failed.');
      return;
    }

    this.map.off('click');
    this.map.on('click', async (e) => {
      if (this.isProcessingClick) {
        console.log('Map click ignored: Processing previous click');
        return;
      }

      this.isProcessingClick = true;
      const { lng, lat } = e.lngLat;
      console.log('Map clicked at:', lng, lat);

      try {
        this.lastClickedLocation = { lat, lng };

        // Hapus marker lama
        if (this.markers.length > 0) {
          clearMarkers(this.markers);
          this.markers = [];
        }

        const { marker, address } = await addMarker(this.map, lat, lng);
        if (marker) {
          this.markers = [marker]; // Simpan hanya satu marker
          const latInput = document.getElementById('lat');
          const lonInput = document.getElementById('lon');
          const locationText = document.getElementById('location-text');
          if (latInput && lonInput) {
            latInput.value = lat.toFixed(6);
            lonInput.value = lng.toFixed(6);
          } else {
            console.error('Latitude or longitude input not found.');
          }
          if (locationText) {
            locationText.textContent = address.details;
            locationText.style.display = 'block';
            console.log('Location text updated to:', address.details);
          }

          // Nonaktifkan klik selama flyTo
          this.map.off('click');
          this.map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
          setTimeout(() => {
            this.map.on('click', this.map._listeners.click[0]); // Kembalikan listener
          }, 1000);

          showToast({
            message: 'Lokasi berhasil ditandai!',
            type: 'success',
          });
        } else {
          console.error('Failed to add marker on click.');
          showToast({
            message: 'Gagal menambahkan marker pada peta.',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error processing map click:', error);
        showToast({
          message: 'Gagal memproses lokasi. Coba lagi.',
          type: 'error',
        });
      } finally {
        this.isProcessingClick = false;
      }
    });

    this.map.getContainer().addEventListener('map:stylechange', async () => {
      console.log('Map style changed, re-adding marker');
      if (this.lastClickedLocation && !this.isProcessingClick) {
        this.isProcessingClick = true;
        try {
          const { lat, lng } = this.lastClickedLocation;

          // Hapus marker lama
          if (this.markers.length > 0) {
            clearMarkers(this.markers);
            this.markers = [];
          }

          const { marker, address } = await addMarker(this.map, lat, lng);
          if (marker) {
            this.markers = [marker];
            const locationText = document.getElementById('location-text');
            if (locationText) {
              locationText.textContent = address.details;
              locationText.style.display = 'block';
              console.log('Location text updated after style change to:', address.details);
            }
            showToast({
              message: 'Lokasi berhasil diperbarui setelah perubahan gaya peta!',
              type: 'success',
            });
          } else {
            console.error('Failed to re-add marker after style change.');
            showToast({
              message: 'Gagal memperbarui marker setelah perubahan gaya peta.',
              type: 'error',
            });
          }
        } catch (error) {
          console.error('Error processing style change:', error);
        } finally {
          this.isProcessingClick = false;
        }
      }
    });
  }

  setupCamera() {
    const startCameraBtn = document.getElementById('start-camera');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');

    startCameraBtn.addEventListener('click', async () => {
      if (startCameraBtn.textContent === 'Buka Kamera') {
        await this.startCamera(video, startCameraBtn);
      } else if (startCameraBtn.textContent === 'Ambil Foto') {
        this.capturePhoto(video, canvas, photoInput, photoPreview, startCameraBtn);
      }
    });

    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file && file.size > 1 * 1024 * 1024) {
        showToast({ message: 'Ukuran foto maksimal 1MB. Pilih file lain.', type: 'error' });
        photoInput.value = '';
        photoPreview.style.display = 'none';
        photoPreview.src = '';
        photoPreview.alt = 'Pratinjau foto yang akan diunggah untuk cerita baru';
      } else if (file) {
        const url = URL.createObjectURL(file);
        photoPreview.src = url;
        photoPreview.style.display = 'block';
        photoPreview.alt = 'Pratinjau foto yang dipilih untuk cerita baru';
        this.isPhotoCaptured = true;
      }
    });
  }

  async startCamera(video, startCameraBtn) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      video.style.display = 'block';
      video.srcObject = this.stream;
      startCameraBtn.textContent = 'Ambil Foto';
      this.isPhotoCaptured = false;
    } catch (error) {
      console.error('Failed to access camera:', error);
      showToast({ message: 'Gagal membuka kamera. Pastikan izin kamera diaktifkan.', type: 'error' });
    }
  }

  capturePhoto(video, canvas, photoInput, photoPreview, startCameraBtn) {
    if (this.isPhotoCaptured) {
      showToast({ message: 'Foto sudah diambil. Kirim cerita atau buka kamera lagi.', type: 'error' });
      return;
    }

    if (!this.stream || !this.stream.active) {
      showToast({ message: 'Kamera tidak aktif. Buka kamera kembali.', type: 'error' });
      return;
    }

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast({ message: 'Gagal mengambil foto. Coba lagi.', type: 'error' });
          this.stopCamera(video, startCameraBtn, photoPreview);
          return;
        }

        if (blob.size > 1 * 1024 * 1024) {
          showToast({ message: 'Foto dari kamera melebihi 1MB. Coba lagi.', type: 'error' });
          this.stopCamera(video, startCameraBtn, photoPreview);
          return;
        }

        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg', lastModified: Date.now() });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;

        if (photoInput.files.length === 1 && photoInput.files[0].name === 'photo.jpg') {
          const url = URL.createObjectURL(blob);
          photoPreview.src = url;
          photoPreview.style.display = 'block';
          photoPreview.alt = 'Pratinjau foto yang diambil dari kamera untuk cerita baru';
          showToast({ message: 'Foto berhasil diambil dan disimpan ke Pilih Foto!', type: 'success' });
          this.isPhotoCaptured = true;
          this.stopCamera(video, startCameraBtn, photoPreview);
          this.stream = null;
        } else {
          showToast({ message: 'Gagal menyimpan foto ke Pilih Foto. Coba pilih file secara manual.', type: 'error' });
          this.stopCamera(video, startCameraBtn, photoPreview);
        }
      },
      'image/jpeg',
      0.9
    );
  }

  stopCamera(video, startCameraBtn, photoPreview) {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      video.style.display = 'none';
    }
    startCameraBtn.textContent = 'Buka Kamera';
  }

  clearMapMarker() {
    if (this.markers.length > 0) {
      clearMarkers(this.markers);
      this.markers = [];
    }
    this.lastClickedLocation = null;
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    const locationText = document.getElementById('location-text');
    if (latInput && lonInput) {
      latInput.value = '';
      lonInput.value = '';
    }
    if (locationText) {
      locationText.textContent = 'Belum ada lokasi yang dipilih';
      locationText.style.display = 'block';
    }
  }

  setupForm() {
    const form = document.getElementById('add-story-form');
    const clearMarkerBtn = document.getElementById('clear-marker-btn');
    const submitButton = form.querySelector('button[type="submit"]');

    if (clearMarkerBtn) {
      clearMarkerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearMapMarker();
        showToast({ message: 'Marker telah dihapus.', type: 'success' });
      });
    }

    let isSubmitting = false;

    console.log('AddStoryPresenter: Adding form submit listener');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isSubmitting) {
        console.log('AddStoryPresenter: Submission already in progress, ignoring.');
        return;
      }

      isSubmitting = true;
      console.log('AddStoryPresenter: Form submitted');

      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      const formData = new FormData(form);
      const photo = formData.get('photo');
      const description = formData.get('description');
      const lat = formData.get('lat');
      const lon = formData.get('lon');

      if (!description) {
        showToast({ message: 'Deskripsi cerita harus diisi.', type: 'error' });
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Tambah Cerita';
        return;
      }

      if (!photo || photo.size === 0) {
        showToast({ message: 'Harap ambil atau pilih foto terlebih dahulu.', type: 'error' });
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Tambah Cerita';
        return;
      }

      if (photo.size > 1 * 1024 * 1024) {
        showToast({ message: 'Ukuran foto maksimal 1MB. Pilih atau ambil foto lain.', type: 'error' });
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Tambah Cerita';
        return;
      }

      if (lat && lon) {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (isNaN(latNum) || isNaN(lonNum)) {
          showToast({ message: 'Koordinat tidak valid.', type: 'error' });
          isSubmitting = false;
          submitButton.disabled = false;
          submitButton.classList.remove('loading');
          submitButton.innerHTML = 'Tambah Cerita';
          return;
        }
        formData.set('lat', latNum);
        formData.set('lon', lonNum);
      } else {
        formData.delete('lat');
        formData.delete('lon');
      }

      formData.delete('style-selector');

      try {
        await this.model.addStory(formData);
        showToast({
          message: 'Cerita Anda berhasil diposting!',
          type: 'success',
        });

        this.isPhotoCaptured = false;
        this.clearMapMarker();
        form.reset();
        const photoPreview = document.getElementById('photo-preview');
        photoPreview.style.display = 'none';
        photoPreview.src = '';
        photoPreview.alt = 'Pratinjau foto yang akan diunggah untuk cerita baru';
        this.stopCamera(
          document.getElementById('video'),
          document.getElementById('start-camera'),
          photoPreview
        );
        router.navigateTo('#/home');
      } catch (error) {
        console.error('AddStoryPresenter: Error adding story:', error);
        showToast({
          message: error.message || 'Gagal menambahkan cerita. Periksa koneksi atau coba lagi.',
          type: 'error',
        });
      } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Tambah Cerita';
      }
    });
  }
}