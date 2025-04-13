// src/utils/map.js
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = 'uFySa8P0xcnYNJ0RPEDk';

const mapStyles = {
  'MapTiler Streets': `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  'MapTiler OpenStreetMap': `https://api.maptiler.com/maps/openstreetmap/style.json?key=${MAPTILER_KEY}`,
};

export function initMap(elementId, options = {}) {
  const defaultOptions = {
    center: [106.8456, -6.2088],
    zoom: 10,
    interactive: true,
    style: 'MapTiler Streets', // Default style
  };
  const mapOptions = { ...defaultOptions, ...options };

  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Map container "${elementId}" not found.`);
    return null;
  }

  // Validate the style option
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

export function addMarker(map, lat, lon, popupContent) {
  if (!map) {
    console.warn('Cannot add marker: Map not initialized.');
    return null;
  }

  if (isNaN(lat) || isNaN(lon)) {
    console.error('Invalid coordinates:', lat, lon);
    return null;
  }

  try {
    console.log('Adding marker at:', lon, lat);
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div style="
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        color: #1f2937;
        max-width: 200px;
        padding: 5px;
      ">
        ${popupContent}
      </div>
    `);

    const marker = new maplibregl.Marker({
      color: '#1e40af',
      draggable: false,
    })
      .setLngLat([lon, lat])
      .setPopup(popup)
      .addTo(map);

    marker.getElement().addEventListener('click', () => {
      marker.togglePopup();
    });

    console.log('Marker added successfully');
    return marker;
  } catch (error) {
    console.error('Failed to add marker:', error);
    return null;
  }
}

export function clearMarkers(markers) {
  if (Array.isArray(markers)) {
    console.log('Clearing markers:', markers.length);
    markers.forEach(marker => marker?.remove());
  }
}