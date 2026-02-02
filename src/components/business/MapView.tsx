import { useState, useEffect, useCallback } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { fetchBusinessesApi } from "../../services/BusinessApi";
import type { BusinessModel } from "../../types/business";
import { ArrowLeft } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const libraries: "marker"[] = ["marker"];

export default function MapView() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
  const navigate = useNavigate();

  // Fetch businesses
  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        const fetchedBusinesses = await fetchBusinessesApi(
          abortController.signal
        );
        if (!abortController.signal.aborted) {
          setBusinesses(
            fetchedBusinesses.filter(
              (b) =>
                b?.location?.pin?.latitude !== undefined &&
                b?.location?.pin?.longitude !== undefined
            )
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
        } else {
          console.error("Failed to fetch businesses", error);
        }
      }
    })();

    return () => {
      abortController.abort("avoid duplicate requests");
    };
  }, []);

  const handleMarkerClick = useCallback(
    (business: BusinessModel) => {
      navigate(`/business/${business.profile.displayName}`);
    },
    [navigate]
  );

  useEffect(() => {
    if (!map || businesses.length === 0) return;

    const pinSvgPath =
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

    businesses.forEach((business) => {
      const position = {
        lat: business.location.pin?.latitude ?? 0,
        lng: business.location.pin?.longitude ?? 0,
      };
      const isGreen =
        business?.distriator?.owner && business.distriator.owner.length > 0;

      const markerIcon = {
        path: pinSvgPath,
        fillColor: isGreen ? "green" : "red",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
        scale: 1.5, // adjust scale for size
        anchor: new window.google.maps.Point(12, 24), // anchor point, adjusted for shape bottom-center
      };

      const marker = new window.google.maps.Marker({
        map,
        position,
        title: business.profile.displayName,
        icon: markerIcon,
      });

      marker.addListener("click", () => handleMarkerClick(business));
    });
  }, [map, businesses, handleMarkerClick]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex w-full h-full">
      <button
        onClick={() => navigate("/businesses")}
        className="absolute top-6 left-6 z-50 bg-white p-2 rounded-full shadow hover:bg-gray-100"
      >
        <ArrowLeft className="w-5 h-5 text-black" />
      </button>
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={2}
          options={{
            mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
          onLoad={(mapInstance) => setMap(mapInstance)}
        />
      </div>
    </div>
  );
}
