import { MapPin } from "lucide-react";
import { type BusinessModel } from "../../types/business";

interface BusinessLocationProps {
  business: BusinessModel;
}

export function BusinessLocation({ business }: BusinessLocationProps) {
  const { location } = business;

  const handleOpenGoogleMaps = () => {
    if (location?.pin) {
      const url = `https://www.google.com/maps?q=${location.pin.latitude},${location.pin.longitude}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Location</h2>

      {/* Address (clickable) */}
      <div
        className="flex flex-col gap-2 p-3 rounded-lg bg-card cursor-pointer hover:bg-accent transition"
        onClick={handleOpenGoogleMaps}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenGoogleMaps();
        }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="text-foreground">{location?.address?.address1}</p>
            {location?.address?.address2 && (
              <p className="text-muted-foreground text-sm">
                {location.address.address2}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              {location?.address?.city}, {location?.address?.state}
            </p>
            <p className="text-muted-foreground text-sm">
              {location?.address?.country}
            </p>
          </div>
        </div>
      </div>

      {/* Google Maps Preview commented out */}
      {/*
      <div className="h-40 md:h-64 rounded-lg overflow-hidden shadow">
        {location?.pin ? (
          <iframe
            title="Business Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${location.pin.latitude},${location.pin.longitude}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Location pin not available
          </div>
        )}
      </div>
      */}
    </div>
  );
}
