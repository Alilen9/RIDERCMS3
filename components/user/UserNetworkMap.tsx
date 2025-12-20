import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PublicBooth } from '../../services/boothService';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, MarkerClustererF } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID } from '@/utils/js-maps-loader';
import { LocateFixed } from 'lucide-react';

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
    id: GOOGLE_MAPS_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY 
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const mapContainerStyle = { width: '100%', height: '100%' };
  const defaultCenter = { lat: -1.286389, lng: 36.817223 }; // Fallback center

  const mapCenter = userLocation || defaultCenter;

  const createMarkerIcon = (booth: PublicBooth) => {
    const isOnline = booth.status === 'online';
    const hasAvailability = booth.availableSlots > 0;
    const color = isOnline && hasAvailability ? '#10b981' : '#ef4444'; // Green if online & available, else red

    const animation = isOnline && hasAvailability ? `
      <animate attributeName="r" from="8" to="20" dur="1.5s" begin="0s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
    ` : '';

    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="8" fill="${color}" />
        <circle cx="20" cy="20" r="8" fill="${color}" fill-opacity="0.5">
          ${animation}
        </circle>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      anchor: new window.google.maps.Point(20, 20),
    };
  };

  const handleCenterOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl border border-gray-700 relative overflow-hidden">
      {!isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="ml-4">Loading Map...</p>
        </div>
      ) : (
        <>
          <GoogleMap
            // mapId="user-dark-map" // A mapId is required for AdvancedMarker
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
            {userLocation && <MarkerF position={userLocation} title="Your Location"/>}
            <MarkerClustererF>
              {(clusterer) => (
                <>
                  {booths.map((booth) => (
                    <MarkerF
                      key={booth.booth_uid}
                      position={{ lat: parseFloat(booth.latitude as any), lng: parseFloat(booth.longitude as any) }}
                      clusterer={clusterer}
                      onClick={() => {
                        onBoothClick(booth);
                        setSelectedBooth(booth);
                      }}
                      icon={createMarkerIcon(booth)}
                    />
                  ))}
                </>
              )}
            </MarkerClustererF>
            {/* InfoWindow logic remains the same, but now it's separate from the MarkerF children */}
            {(hoveredBooth || selectedBooth) && (
              <InfoWindow
                position={{ lat: parseFloat((hoveredBooth || selectedBooth)!.latitude as any), lng: parseFloat((hoveredBooth || selectedBooth)!.longitude as any) }}
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
          {userLocation && (
            <button
              onClick={handleCenterOnUser}
              className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors z-10"
              title="Center on my location"
            >
              <LocateFixed size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default UserNetworkMap;