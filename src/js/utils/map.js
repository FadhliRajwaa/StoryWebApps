import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';

const MAPTILER_KEY = 'uFySa8P0xcnYNJ0RPEDk';

// Cache sederhana untuk alamat berdasarkan koordinat
const addressCache = new Map();

const mapStyles = {
  'MapTiler Streets': `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  'MapTiler OpenStreetMap': `https://api.maptiler.com/maps/openstreetmap/style.json?key=${MAPTILER_KEY}`,
};

async function getAddress(lat, lon) {
  const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  if (addressCache.has(cacheKey)) {
    console.log(`Address fetched from cache for ${cacheKey}:`, addressCache.get(cacheKey));
    return addressCache.get(cacheKey);
  }

  try {
    console.log(`Fetching address for lat:${lat}, lon:${lon}`);
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { timeout: 3000 } // Timeout 3 detik
    );
    const data = response.data;
    const locationName = data.display_name || `Koordinat ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    addressCache.set(cacheKey, locationName);
    console.log(`Address fetched: ${locationName}`);
    return locationName;
  } catch (error) {
    console.error('Error fetching address:', error.message);
    const fallback = `Koordinat ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    addressCache.set(cacheKey, fallback);
    return fallback;
  }
}

export function initMap(elementId, options = {}) {
  const defaultOptions = {
    center: [106.8456, -6.2088],
    zoom: 10,
    interactive: true,
    style: 'MapTiler Streets',
  };
  const mapOptions = { ...defaultOptions, ...options };

  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Map container "${elementId}" not found.`);
    return null;
  }

  const selectedStyle = mapStyles[mapOptions.style] ? mapOptions.style : 'MapTiler Streets';
  console.log(`Map: Initializing with style: ${selectedStyle}`);

  try {
    const map = new maplibregl.Map({
      container: elementId,
      style: mapStyles[selectedStyle],
      center: mapOptions.center,
      zoom: mapOptions.zoom,
      interactive: mapOptions.interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      console.log('Map loaded successfully with style:', selectedStyle);
      container.setAttribute('aria-label', 'Peta interaktif untuk memilih atau melihat lokasi');
      const layerControl = document.querySelector('.map-style-selector');
      if (layerControl) {
        const radios = layerControl.querySelectorAll('input[type="radio"][name="style-selector"]');
        radios.forEach(radio => {
          radio.addEventListener('change', (e) => {
            const newStyle = e.target.value;
            console.log('Changing map style to:', newStyle);
            map.setStyle(mapStyles[newStyle]);
            const markerEvent = new Event('map:stylechange');
            map.getContainer().dispatchEvent(markerEvent);
          });
        });
      }
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
      container.innerHTML = `
        <div class="map-fallback" role="alert">
          Gagal memuat peta. Pastikan koneksi internet stabil.
        </div>
      `;
    });

    return map;
  } catch (error) {
    console.error('Map initialization failed:', error);
    container.innerHTML = `
      <div class="map-fallback" role="alert">
        Gagal memuat peta. Pastikan koneksi internet stabil.
      </div>
    `;
    return null;
  }
}

export async function addMarker(map, lat, lon, fallbackContent = 'Lokasi Cerita Anda') {
  if (!map && map !== null) {
    console.warn('Cannot add marker: Map not initialized.');
    const address = await getAddress(lat, lon);
    return { marker: null, address: { coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, details: address } };
  }

  if (isNaN(lat) || isNaN(lon)) {
    console.error('Invalid coordinates:', lat, lon);
    return { marker: null, address: { coordinates: 'Tidak tersedia', details: 'Lokasi tidak diketahui' } };
  }

  try {
    console.log('Adding marker at:', lon, lat);
    // Validasi koordinat
    const validLat = Math.max(-90, Math.min(90, parseFloat(lat)));
    const validLon = Math.max(-180, Math.min(180, parseFloat(lon)));
    if (Math.abs(validLat - lat) > 0.000001 || Math.abs(validLon - lon) > 0.000001) {
      console.warn('Coordinates adjusted to valid range:', validLat, validLon);
    }

    let marker = null;
    if (map) {
      marker = new maplibregl.Marker({
        color: '#1e40af',
        draggable: false,
      })
        .setLngLat([validLon, validLat])
        .addTo(map);
    }

    // Panggil getAddress setelah marker
    const address = await getAddress(validLat, validLon);

    // Popup hanya untuk halaman detail
    if (!document.getElementById('add-story-form') && marker) {
      const popupContent = `
        <div class="map-popup-content">
          <h3>${address}</h3>
          <button class="popup-close-btn" aria-label="Tutup popup">✕</button>
        </div>
      `;
      const popup = new maplibregl.Popup({
        offset: 35,
        className: 'map-popup',
        closeOnClick: false,
        closeButton: false,
        focusAfterOpen: true,
      }).setHTML(popupContent);

      marker.setPopup(popup);

      let isProcessingClick = false;
      const handleMarkerClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isProcessingClick) {
          console.log('Click ignored: Processing previous click');
          return;
        }

        isProcessingClick = true;
        console.log('Marker clicked at:', validLon, validLat);

        if (!popup.isOpen()) {
          popup.setLngLat([validLon, validLat]).addTo(map);
          console.log('Popup added to map at:', validLon, validLat);
          setTimeout(() => {
            if (popup.isOpen()) {
              console.log('Popup confirmed open');
            }
          }, 500);
        }

        setTimeout(() => {
          isProcessingClick = false;
        }, 500);
      };

      marker.getElement().removeEventListener('click', marker.getElement()._clickHandler);
      marker.getElement().removeEventListener('mousedown', marker.getElement()._clickHandler);
      marker.getElement().removeEventListener('mouseup', marker.getElement()._clickHandler);
      marker.getElement().addEventListener('click', handleMarkerClick);
      marker.getElement()._clickHandler = handleMarkerClick;

      popup.on('open', () => {
        console.log('Popup opened at:', validLon, validLat);
        const closeBtn = document.querySelector('.popup-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            console.log('Popup closed by button');
            popup.remove();
          }, { once: true });
        }
      });

      popup.on('close', () => {
        console.log('Popup closed at:', validLon, validLat);
      });

      marker.getElement().setAttribute('aria-label', `Marker pada ${address}`);
    }

    console.log('Marker added successfully with address:', address);
    return {
      marker,
      address: { coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, details: address },
    };
  } catch (error) {
    console.error('Failed to add marker:', error);
    return {
      marker: null,
      address: { coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, details: 'Lokasi tidak diketahui' },
    };
  }
}

export function clearMarkers(markers) {
  if (Array.isArray(markers)) {
    console.log('Clearing markers:', markers.length);
    markers.forEach(marker => {
      try {
        marker?.remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
  }
}