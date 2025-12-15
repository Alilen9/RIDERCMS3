import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Booth } from '../../types';
import { getBooths } from '../../services/adminService';
import toast from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, InfoWindow, MarkerF } from '@react-google-maps/api';

interface NetworkMapProps {
  onBoothClick: (booth: Booth) => void;
}

const NetworkMap: React.FC<NetworkMapProps> = ({ onBoothClick }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [hoveredBooth, setHoveredBooth] = useState<Booth | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCD1_cfwN7m0a5R_NxXclDNK-S1gw7NZgk",
  });

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      try {
        const response = await getBooths();
        console.log('NetworkMap: Fetched booth data from API:', response);
        const allBooths = response.booths;

        console.log(`NetworkMap: Retrieved ${allBooths.length} booths from API.`);
        const mappableBooths = response.booths.filter(b => b.latitude != null && b.longitude != null);

        if (mappableBooths.length < allBooths.length) {
          console.warn(`NetworkMap: ${allBooths.length - mappableBooths.length} booth(s) could not be displayed due to missing coordinate data.`);
        }

        setBooths(mappableBooths);

        if (mappableBooths.length > 0) {
          if (mapRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            mappableBooths.forEach(booth => {
              bounds.extend(new window.google.maps.LatLng(Number(booth.latitude), Number(booth.longitude)));
            });
            mapRef.current.fitBounds(bounds);
          }
        }

      } catch (err) {
        toast.error("Failed to load network map data.");
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = booths.filter(booth =>
      booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booth.booth_uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results.slice(0, 5)); // Limit to 5 results
  }, [searchTerm, booths]);

  const CustomAdminMarker: React.FC<{ status: string }> = ({ status }) => {
    const color = status === 'online' ? '#10b981' : '#ef4444';
    return (
      <div style={{ width: 40, height: 40, position: 'relative', transform: 'translate(-50%, -50%)' }}>
        <style>{`
          .pulse-animation-admin { animation: pulse-admin 1.5s infinite; }
          @keyframes pulse-admin {
            0% { transform: scale(0.5); opacity: 0.5; }
            70% { transform: scale(1); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }`}</style>
        <div className="pulse-animation-admin" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: color, opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 16, height: 16, borderRadius: '50%', backgroundColor: color, transform: 'translate(-50%, -50%)' }} />
      </div>
    );
  };

  const handleSearchResultClick = (booth: Booth) => {
    if (booth.latitude && booth.longitude) {
      mapRef.current?.panTo({ lat: Number(booth.latitude), lng: Number(booth.longitude) });
      mapRef.current?.setZoom(16);
      setSelectedBooth(booth);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    if (booths.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      booths.forEach(booth => {
        bounds.extend(new window.google.maps.LatLng(Number(booth.latitude), Number(booth.longitude)));
      });
      map.fitBounds(bounds);
    }
  }, [booths]);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  const mapContainerStyle = { width: '100%', height: '100%' };
  const defaultCenter = { lat: -1.286389, lng: 36.817223 };

  return <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Network Map</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a booth..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              {searchResults.map(booth => (
                <div key={booth.booth_uid} onClick={() => handleSearchResultClick(booth)} className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm">
                  <p className="font-semibold">{booth.name}</p>
                  <p className="text-xs text-gray-400">{booth.location_address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4 text-sm pl-4 border-l border-gray-700">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Offline</div>
        </div>
      </div>
    </div>
    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700 relative overflow-hidden">
      {loading || !isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="ml-4">{!isLoaded ? "Loading Google Maps..." : "Loading Booth Locations..."}</p>
        </div>
      ) : (
        <GoogleMap
          // mapId="admin-dark-map" // A mapId is required for AdvancedMarker
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={10}
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
          {booths.map((booth) => (
            <MarkerF
              key={booth.booth_uid}
              position={{ lat: Number(booth.latitude), lng: Number(booth.longitude) }}
              onClick={() => {
                onBoothClick(booth);
                setSelectedBooth(booth);
                setHoveredBooth(null); // Hide hover info window on click
              }}
            >
              <CustomAdminMarker status={booth.status} />
            </MarkerF>
          ))}
          {hoveredBooth && !selectedBooth && (
            <InfoWindow position={{ lat: Number(hoveredBooth.latitude), lng: Number(hoveredBooth.longitude) }} onCloseClick={() => setHoveredBooth(null)}>
              <div className="p-1 text-black">
                <p className="font-bold text-sm">{hoveredBooth.name}</p>
                <p className="text-xs text-gray-600">Total Slots: {hoveredBooth.slotCount ?? 'N/A'}</p>
                <p className="text-xs text-gray-600">Availability: {hoveredBooth.status ?? 'N/A'}</p>
              </div>
            </InfoWindow>
          )}
          {selectedBooth && (
            <InfoWindow position={{ lat: Number(selectedBooth.latitude), lng: Number(selectedBooth.longitude) }} onCloseClick={() => setSelectedBooth(null)}>
              <div className="p-1 text-black">
                <p className="font-bold text-sm">{selectedBooth.name}</p>
                <p className="text-xs text-gray-600">{selectedBooth.location_address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
    </div>
  </div>
};

export default NetworkMap;