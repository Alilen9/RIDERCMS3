import React, { useState, useEffect } from 'react';
import { Booth } from '../../types';
import { getBooths } from '../../services/adminService';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface NetworkMapProps {
  onBoothClick: (booth: Booth) => void;
}

// A helper component to programmatically change the map's view
const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [center, zoom, map]);
  return null;
};

const NetworkMap: React.FC<NetworkMapProps> = ({ onBoothClick }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Booth[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.286389, 36.817223]); // Default center

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      try {
        const response = await getBooths();
        console.log("Fetched booths for map:", response);
        // Filter for booths that have coordinate data to display on the map
        const mappableBooths = response.booths.filter(b => b.latitude != null && b.longitude != null);
        setBooths(mappableBooths);
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

  // Custom icon function to replicate the previous style
  const createCustomIcon = (status: 'online' | 'offline' | 'maintenance' | string) => {
    const color = status === 'online' ? '#10b981' : '#ef4444';
    return L.divIcon({
      html: `<div style="background-color: ${color}; box-shadow: 0 0 15px ${color};" class="w-4 h-4 rounded-full"></div><div style="background-color: ${color};" class="absolute -inset-2 rounded-full opacity-20 animate-ping"></div>`,
      className: 'relative',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  const handleSearchResultClick = (booth: Booth) => {
    if (booth.latitude && booth.longitude) {
      setMapCenter([booth.latitude, booth.longitude]);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

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
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="ml-4">Loading Booth Locations...</p>
        </div>
      ) : (
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ backgroundColor: '#111827' }}
        >
          <ChangeView center={mapCenter} zoom={16} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {booths.map((booth) => (
            <Marker
              key={booth.booth_uid}
              position={[parseFloat(booth.latitude as any), parseFloat(booth.longitude as any)]}
              icon={createCustomIcon(booth.status)}
              eventHandlers={{
                click: () => {
                  onBoothClick(booth);
                },
              }}
            >
              <Popup>
                <div className="bg-gray-800 text-white p-0 m-[-12px] rounded-lg">
                  <div className="p-2">
                    <p className="font-bold text-sm">{booth.name}</p>
                    <p className="text-xs text-gray-400">{booth.location_address}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  </div>
};

export default NetworkMap;