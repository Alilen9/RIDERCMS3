import { Libraries } from "@react-google-maps/api";

// src/config/googleMaps.ts
export const GOOGLE_MAPS_ID = 'google-map-script';
export const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCD1_cfwN7m0a5R_NxXclDNK-S1gw7NZgk";

// Centralized libraries to load. 'geometry' is needed for distance calculations.
export const GOOGLE_MAPS_LIBRARIES: Libraries = [
  'geometry',
  'places',
];

export const useJsApiLoaderOptions = {
  id: GOOGLE_MAPS_ID,
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  libraries: GOOGLE_MAPS_LIBRARIES,
};