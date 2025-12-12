import Constants from "expo-constants";
import { Platform, Linking } from "react-native";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
  "AIzaSyApB47DdUIOvYUPb6tNF5fQf93H5d1p0Uo"; // Fallback API key

export interface DirectionsResult {
  distance: string; // e.g., "5.2 km"
  duration: string; // e.g., "15 mins"
  polyline: string; // Encoded polyline
  distanceValue: number; // Distance in meters
  durationValue: number; // Duration in seconds
  startAddress: string;
  endAddress: string;
  steps: Array<{
    distance: string;
    duration: string;
    instruction: string;
  }>;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

export const getDirections = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<DirectionsResult | null> => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&language=vi`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        polyline: route.overview_polyline.points,
        distanceValue: leg.distance.value,
        durationValue: leg.duration.value,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps: leg.steps.map((step: any) => ({
          distance: step.distance.text,
          duration: step.duration.text,
          instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
        })),
      };
    }

    console.error("Directions API error:", data.status, data.error_message);
    return null;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};

// Decode Google polyline to coordinates
export const decodePolyline = (
  encoded: string
): Array<{ latitude: number; longitude: number }> => {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Open external navigation app (Google Maps or Apple Maps)
 */
export function openExternalNavigation(
  destination: Coordinate,
  label?: string
): void {
  const { latitude, longitude } = destination;
  const labelParam = label ? encodeURIComponent(label) : "";

  const url =
    Platform.OS === "ios"
      ? `maps://app?daddr=${latitude},${longitude}&q=${labelParam}`
      : `google.navigation:q=${latitude},${longitude}`;

  Linking.openURL(url).catch((err) => {
    console.error("Failed to open maps:", err);
    // Fallback to browser
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(webUrl);
  });
}
