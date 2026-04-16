import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix missing leaf icon path issues inherently seen in React Leaflet setups
import iconRect from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconRect.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Source/Dest/Vehicle
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 50%; box-shadow: 0 0 10px ${color}, 0 0 20px ${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const originIcon = createCustomIcon('#3b82f6'); // blue
const destIcon = createCustomIcon('#d946ef'); // fuchsia
const vehicleIcon = createCustomIcon('#14b8a6'); // teal

const PRESET_LOCATIONS: Record<string, [number, number]> = {
    "Singapore": [1.3521, 103.8198],
    "Mumbai": [19.0760, 72.8777],
    "Mumbai Port": [18.9400, 72.8300],
    "Approaching Chennai Port": [13.0827, 80.2707],
    "Chennai": [13.0827, 80.2707],
    "UAE Port": [25.2769, 55.2962],
    "Gujarat Port": [22.7300, 69.7300],
    "Vishakapatnam Port": [17.6800, 83.2100],
    "Shanghai": [31.2304, 121.4737],
    "Rotterdam": [51.9244, 4.4777],
    "New York": [40.7128, -74.0060],
    "Arabian Sea": [15.0, 65.0],
    "Bay of Bengal": [15.0, 88.0],
    "Malacca Strait": [4.0, 100.0],
    "Red Sea": [20.0, 38.0],
    "Mediterranean": [35.0, 18.0]
};

export default function MapComponent({ state }: { state: any }) {
  const originCoord = PRESET_LOCATIONS[state?.shipment?.origin] || PRESET_LOCATIONS["Singapore"];
  const destCoord = PRESET_LOCATIONS[state?.shipment?.destination] || PRESET_LOCATIONS["Mumbai"];

  const currentCoord = useMemo(() => {
    if (state?.weather_data?.coord) {
      return [state.weather_data.coord.lat, state.weather_data.coord.lon] as [number, number];
    }
    return PRESET_LOCATIONS[state?.shipment?.current_location] || PRESET_LOCATIONS["Chennai"];
  }, [state]);

  const routePositions = [originCoord, currentCoord, destCoord];

  // Derive risk zone styles
  const isHighRisk = state?.risk_result?.risk_category === "HIGH";
  
  return (
    <MapContainer 
      center={currentCoord} 
      zoom={5} 
      scrollWheelZoom={false}
      className="w-full h-full bg-[#02040a]"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <Polyline positions={routePositions} color="#0ea5e9" weight={2} dashArray="5, 10" />

      {/* Origin Node */}
      <Marker position={originCoord} icon={originIcon}>
        <Popup className="custom-popup">
          <b className="text-blue-500">Origin</b><br />
          {state?.shipment?.origin || "Singapore"}
        </Popup>
      </Marker>

      {/* Destination Node */}
      <Marker position={destCoord} icon={destIcon}>
        <Popup className="custom-popup">
          <b className="text-fuchsia-500">Destination</b><br />
          {state?.shipment?.destination || "Mumbai"}
        </Popup>
      </Marker>

      {/* Current Position */}
      <Marker position={currentCoord} icon={vehicleIcon}>
        <Popup className="custom-popup">
          <b className="text-teal-500">Fleet ID: {state?.shipment?.id || "SHP-X9001"}</b><br />
          Location: {state?.weather_data?.name || state?.shipment?.current_location}<br/>
          Status: {state?.shipment?.status || "IN_TRANSIT"}
        </Popup>
      </Marker>

      {/* Draw risk area highlighting around current location if HIGH Risk */}
      {isHighRisk && (
         <Circle 
          center={currentCoord} 
          pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.15 }} 
          radius={500000} // 500km radius mock danger zone
         />
      )}
    </MapContainer>
  );
}
