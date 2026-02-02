import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Dialog } from "./PlaceNameDialog";
import { ArrowLeft } from "lucide-react"; // ⬅️ Using lucide-react for the back icon (optional)
import { useAuthData } from "../../../utils/auth-utils";
import { PickAddressScreen } from "./PickAddressScreen";
import { PlacesService, type Place } from "../../../services/places-service";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

export default function LocationPicker() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showPickAddress, setShowPickAddress] = useState(false);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const { token } = useAuthData();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  // Get current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(loc);
        setSelectedLocation(loc); // ⬅️ This line sets the initial marker!
      },
      () => {
        const loc = { lat: 51.5, lng: -0.09 };
        setUserLocation(loc);
        setSelectedLocation(loc); // ⬅️ Fallback marker
      }
    );
  }, []);

  // Handler for Dialog submit (gets place list)
  const handlePlaceDialogSubmit = (results: Place[]) => {
    setPlaces(results);
    setShowPickAddress(true);
    setShowDialog(false);
  };
  // Handler for address pick (navigate to form with autofill data)
  const handlePickAddress = async (place: Place) => {
    // Parse address components
    const addressComponents = place.addressComponents ?? [];
    // Address One: first three longText values
    const address1 = addressComponents.slice(0, 3).map(comp => comp.longText).filter(Boolean).join(", ");
    // Address Two: next three longText values (4th, 5th, 6th)
    const address2 = addressComponents.slice(3, 6).map(comp => comp.longText).filter(Boolean).join(", ");

    let city = "";
    let state = "";
    let country = "";
    addressComponents.forEach((comp) => {
      if (comp.types?.includes("postal_town") || comp.types?.includes("locality")) {
        city = comp.longText;
      } else if (!city && comp.types?.includes("administrative_area_level_3")) {
        city = comp.longText; // Fallback for city
      }
      if (comp.types?.includes("administrative_area_level_1")) state = comp.longText;
      if (comp.types?.includes("country")) country = comp.longText;
    });
    const workTime = place.currentOpeningHours?.weekdayDescriptions?.map(day => `- ${day}`).join("\n") ?? "";
    // Get up to 3 images using getPhotoUrl
    let displayImage = "";
    let images: string[] = [];
    if (place.photos?.length && token) {
      try {
        const urlArr = await Promise.all(
          place.photos.slice(0, 3).map(ph => PlacesService.getPhotoUrl(ph.name, token))
        );
        displayImage = urlArr[0] ?? "";
        images = urlArr.slice(1);
      } catch (error) {
        console.error("Failed to fetch photo URLs:", error);
      }
    }
    navigate("/business/create/form", {
      state: {
        displayName: place.displayName?.text,
        businessType: place.primaryTypeDisplayName?.text ?? "",
        workTime,
        address1,
        address2,
        city,
        state,
        country,
        latitude: place.location?.latitude?.toString() ?? "",
        longitude: place.location?.longitude?.toString() ?? "",
        phoneNumber: place.internationalPhoneNumber ?? "",
        displayImage,
        images,
        _place: place,
      },
    });
  };

  if (showPickAddress && places) {
    return (
      <PickAddressScreen
        places={places}
        onPick={handlePickAddress}
        onBack={() => {
          setShowPickAddress(false);
          setShowDialog(true);
        }}
      />
    );
  }

  if (!isLoaded)     return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading Map...</p>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full relative">
      {/* Back Button */}
      <button
        onClick={() => navigate("/businesses")}
        className="absolute top-6 left-6 z-50 bg-white p-2 rounded-full shadow hover:bg-gray-100"
      >
        <ArrowLeft className="w-5 h-5 text-black" />
      </button>

      <GoogleMap
        key={
          userLocation ? userLocation.lat + "," + userLocation.lng : "default"
        }
        mapContainerStyle={containerStyle}
        center={userLocation ?? { lat: 51.5, lng: -0.09 }}
        zoom={12}
        onClick={(e) => {
          if (e.latLng) {
            setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        }}
      >
        {selectedLocation && <Marker position={selectedLocation} />}
      </GoogleMap>

      {/* Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3">
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded-lg shadow"
          onClick={() => navigate("/business/create/form")}
        >
          Skip
        </button>

        {selectedLocation && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => setShowDialog(true)}
          >
            Confirm
          </button>
        )}
      </div>

      {/* PlaceNameDialog */}
      {showDialog && (
        <Dialog
          title="Place Name"
          latitude={selectedLocation?.lat}
          longitude={selectedLocation?.lng}
          token={token}
          onClose={() => setShowDialog(false)}
          onSubmit={handlePlaceDialogSubmit}
        />
      )}
    </div>
  );
}
