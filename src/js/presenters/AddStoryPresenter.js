import { StoryModel } from '../models/StoryModel.js';
import { AddStoryView } from '../views/AddStoryView.js';
import { initMap, addMarker, clearMarkers } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import { subscribeToNotifications } from '../utils/notifications.js';
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
    this.isProcessingClick = false;
    // Simpan referensi ke elemen dan handler
    this.form = null;
    this.clearMarkerBtn = null;
    this.startCameraBtn = null;
    this.photoInput = null;
    this.submitHandler = null;
    this.clearMarkerHandler = null;
    this.startCameraHandler = null;
    this.photoInputHandler = null;
    this.init();
  }

  async init() {
    console.log('AddStoryPresenter: Initializing...');
    if (!Auth.isAuthenticated()) {
      console.log('AddStoryPresenter: User not authenticated, redirecting to login');
      showToast({ message: 'Silakan login untuk menambahkan cerita.', type: 'warning' });
      router.navigateTo('#/login');
      return;
    }

    document.getElementById('app').innerHTML = this.view.render();
    await this.setupMap();
    this.setupCamera();
    this.setupForm();
    this.animateElements();
  }

  async setupMap() {
    this.map = await initMap('map', {
      center: [106.8456, -6.2088],
      zoom: 10,
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

        if (this.markers.length > 0) {
          clearMarkers(this.markers);
          this.markers = [];
        }

        const { marker, address } = await addMarker(this.map, lat, lng);
        if (marker) {
          this.markers = [marker];
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

          this.map.off('click');
          this.map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
          setTimeout(() => {
            this.map.on('click', this.map._listeners.click[0]);
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
    this.startCameraBtn = document.getElementById('start-camera');
    this.photoInput = document.getElementById('photo');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoPreview = document.getElementById('photo-preview');

    // Pastikan elemen ada sebelum menambahkan event listener
    if (this.startCameraBtn) {
      this.startCameraHandler = async () => {
        if (this.startCameraBtn.textContent === 'Buka Kamera') {
          await this.startCamera(video, this.startCameraBtn);
        } else if (this.startCameraBtn.textContent === 'Ambil Foto') {
          this.capturePhoto(video, canvas, this.photoInput, photoPreview, this.startCameraBtn);
        }
      };
      this.startCameraBtn.addEventListener('click', this.startCameraHandler);
    }

    if (this.photoInput) {
      this.photoInputHandler = () => {
        const file = this.photoInput.files[0];
        if (file && file.size > 1 * 1024 * 1024) {
          showToast({ message: 'Ukuran foto maksimal 1MB. Pilih file lain.', type: 'error' });
          this.photoInput.value = '';
          if (photoPreview) {
            photoPreview.style.display = 'none';
            photoPreview.src = '';
            photoPreview.alt = 'Pratinjau foto yang akan diunggah untuk cerita baru';
          }
        } else if (file) {
          const url = URL.createObjectURL(file);
          if (photoPreview) {
            photoPreview.src = url;
            photoPreview.style.display = 'block';
            photoPreview.alt = 'Pratinjau foto yang dipilih untuk cerita baru';
          }
          this.isPhotoCaptured = true;
        }
      };
      this.photoInput.addEventListener('change', this.photoInputHandler);
    }
  }

  async startCamera(video, startCameraBtn) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      if (video) {
        video.style.display = 'block';
        video.srcObject = this.stream;
      }
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
          if (photoPreview) {
            photoPreview.src = url;
            photoPreview.style.display = 'block';
            photoPreview.alt = 'Pratinjau foto yang diambil dari kamera untuk cerita baru';
          }
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
      if (video) {
        video.srcObject = null;
        video.style.display = 'none';
      }
    }
    if (startCameraBtn) {
      startCameraBtn.textContent = 'Buka Kamera';
    }
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
    this.form = document.getElementById('add-story-form');
    this.clearMarkerBtn = document.getElementById('clear-marker-btn');
    const submitButton = this.form.querySelector('button[type="submit"]');

    // Pastikan elemen ada sebelum menambahkan event listener
    if (this.clearMarkerBtn) {
      this.clearMarkerHandler = (e) => {
        e.preventDefault();
        this.clearMapMarker();
        showToast({ message: 'Marker telah dihapus.', type: 'success' });
      };
      this.clearMarkerBtn.addEventListener('click', this.clearMarkerHandler);
    }

    let isSubmitting = false;

    console.log('AddStoryPresenter: Adding form submit listener');
    this.submitHandler = async (e) => {
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

      const formData = new FormData(this.form);
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

        await subscribeToNotifications('Cerita Baru Ditambahkan', {
          body: 'Cerita Anda telah berhasil diposting!',
          tag: `story-added-${Date.now()}`,
        });

        this.isPhotoCaptured = false;
        this.clearMapMarker();
        this.form.reset();

        const photoPreview = document.getElementById('photo-preview');
        const video = document.getElementById('video');
        const startCameraBtn = document.getElementById('start-camera');

        if (photoPreview) {
          photoPreview.style.display = 'none';
          photoPreview.src = '';
          photoPreview.alt = 'Pratinjau foto yang akan diunggah untuk cerita baru';
        }

        if (video && startCameraBtn) {
          this.stopCamera(video, startCameraBtn, photoPreview);
        }

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
    };

    this.form.addEventListener('submit', this.submitHandler);
  }

  animateElements() {
    console.log('AddStoryPresenter: Animating elements with Animation API');
    const form = document.getElementById('add-story-form');
    const mapContainer = document.getElementById('map');
    if (form) {
      form.animate(
        [
          { opacity: 0, transform: 'translateY(30px) scale(0.95)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
    if (mapContainer) {
      mapContainer.animate(
        [
          { opacity: 0, transform: 'translateX(20px) rotate(3deg)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateX(0) rotate(0deg)', filter: 'blur(0px)' },
        ],
        {
          duration: 600,
          delay: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
  }

  cleanup() {
    console.log('AddStoryPresenter: Cleaning up...');
    // Bersihkan event listener dari form
    if (this.form && this.submitHandler) {
      this.form.removeEventListener('submit', this.submitHandler);
    }
    // Bersihkan event listener dari clear marker button
    if (this.clearMarkerBtn && this.clearMarkerHandler) {
      this.clearMarkerBtn.removeEventListener('click', this.clearMarkerHandler);
    }
    // Bersihkan event listener dari start camera button
    if (this.startCameraBtn && this.startCameraHandler) {
      this.startCameraBtn.removeEventListener('click', this.startCameraHandler);
    }
    // Bersihkan event listener dari photo input
    if (this.photoInput && this.photoInputHandler) {
      this.photoInput.removeEventListener('change', this.photoInputHandler);
    }
    // Hentikan stream kamera jika ada
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    // Bersihkan marker peta
    if (this.markers.length > 0) {
      clearMarkers(this.markers);
      this.markers = [];
    }
    // Bersihkan peta jika ada
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}