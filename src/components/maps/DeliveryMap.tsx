import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';

interface DeliveryMapProps {
  destinationLat: number;
  destinationLng: number;
  showRoute?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

export default function DeliveryMap({
  destinationLat,
  destinationLng,
  showRoute = true,
}: DeliveryMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [error, setError] = useState<string>('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const depotLat = parseFloat(import.meta.env.VITE_DEPOT_LAT || '45.6843');
  const depotLng = parseFloat(import.meta.env.VITE_DEPOT_LNG || '4.9095');

  const center = {
    lat: (depotLat + destinationLat) / 2,
    lng: (depotLng + destinationLng) / 2,
  };

  useEffect(() => {
    if (showRoute && window.google) {
      calculateRoute();
    }
  }, [destinationLat, destinationLng, showRoute]);

  const calculateRoute = () => {
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: depotLat, lng: depotLng },
        destination: { lat: destinationLat, lng: destinationLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');
          }
        } else {
          setError('Impossible de calculer l\'itinéraire');
        }
      }
    );
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">Configuration Google Maps manquante</p>
        <p className="text-sm text-yellow-700 mt-1">
          Veuillez configurer VITE_GOOGLE_MAPS_KEY dans le fichier .env
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {distance && duration && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 font-medium">Distance</p>
              <p className="text-lg font-bold text-green-900">{distance}</p>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Durée estimée</p>
              <p className="text-lg font-bold text-green-900">{duration}</p>
            </div>
          </div>
        </div>
      )}

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={showRoute ? 11 : 14}
        >
          <Marker
            position={{ lat: depotLat, lng: depotLng }}
            label="D"
            title="Dépôt MYGROS"
          />
          <Marker
            position={{ lat: destinationLat, lng: destinationLng }}
            label="C"
            title="Client"
          />
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </LoadScript>

      <button
        onClick={openInGoogleMaps}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
      >
        <Navigation className="w-5 h-5" />
        Ouvrir dans Google Maps
      </button>
    </div>
  );
}
