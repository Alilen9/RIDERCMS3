import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PublicBooth } from '../../services/boothService';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface UserNetworkMapProps {
  booths: PublicBooth[];
  userLocation: { lat: number; lng: number } | null;
  onBoothClick: (booth: PublicBooth) => void;
}

const UserNetworkMap: React.FC<UserNetworkMapProps> = ({ booths, userLocation, onBoothClick }) => {
  const [selectedBooth, setSelectedBooth] = useState<PublicBooth | null>(null);
  const [hoveredBooth, setHoveredBooth] = useState<PublicBooth | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'user-google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const createCustomIcon = (booth: PublicBooth): google.maps.Icon => {
    const isOnline = booth.status === 'online';
    const hasAvailability = booth.availableSlots > 0;
    const color = isOnline && hasAvailability ? '#10b981' : '#ef4444'; // Green if online & available, else red

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
          <style>
            .pulse {
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0% { transform: scale(0.5); opacity: 0.5; }
              70% { transform: scale(1); opacity: 0; }
              100% { transform: scale(1); opacity: 0; }
            }
          </style>
          <circle cx="20" cy="20" r="16" fill="${color}" fill-opacity="0.3" class="${isOnline && hasAvailability ? 'pulse' : ''}" />
          <circle cx="20" cy="20" r="8" fill="${color}" />
        </svg>`
      )}`,
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20),
    };
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const mapContainerStyle = { width: '100%', height: '100%' };
  const defaultCenter = { lat: -1.286389, lng: 36.817223 }; // Fallback center

  const mapCenter = userLocation || defaultCenter;

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl border border-gray-700 relative overflow-hidden">
      {!isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="ml-4">Loading Map...</p>
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [ // Dark mode map style
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
              { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
              { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
              { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
              { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
              { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
              { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
              { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
              { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
            ]
          }}
        >
          {userLocation && <Marker position={userLocation} title="Your Location" />}
          {booths.map((booth) => (
            <Marker
              key={booth.booth_uid}
              position={{ lat: booth.latitude, lng: booth.longitude }}
              icon={createCustomIcon(booth)}
              onClick={() => {
                onBoothClick(booth);
                setSelectedBooth(booth);
                setHoveredBooth(null);
              }}
              onMouseOver={() => setHoveredBooth(booth)}
              onMouseOut={() => setHoveredBooth(null)}
            />
          ))}
          {(hoveredBooth || selectedBooth) && (
            <InfoWindow
              position={{ lat: (hoveredBooth || selectedBooth)!.latitude, lng: (hoveredBooth || selectedBooth)!.longitude }}
              onCloseClick={() => {
                setHoveredBooth(null);
                setSelectedBooth(null);
              }}
            >
              <div className="p-1 text-black">
                <p className="font-bold text-sm">{(hoveredBooth || selectedBooth)!.name}</p>
                <p className="text-xs text-gray-600">
                  Available Slots: {(hoveredBooth || selectedBooth)!.availableSlots ?? 'N/A'}
                </p>
                <p className="text-xs text-gray-600">Status: {(hoveredBooth || selectedBooth)!.status}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
    </div>
  );
};

export default UserNetworkMap;