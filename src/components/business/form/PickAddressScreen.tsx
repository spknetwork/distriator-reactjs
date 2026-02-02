import { type Place } from "../../../services/places-service";
import { ArrowLeft } from "lucide-react";

interface PickAddressScreenProps {
  places: Place[];
  onPick: (item: Place) => void;
  onBack?: () => void;
}

export function PickAddressScreen({ places, onPick, onBack }: PickAddressScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-border bg-background sticky top-0 z-10">
        <button
          onClick={onBack}
          className="mr-3 p-2 rounded-full hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Pick Your Address</h1>
      </header>
      <ul className="divide-y divide-border">
        {places.map((place, idx) => (
          <li
            key={place.displayName?.text + idx}
            className="p-4 cursor-pointer hover:bg-primary/10"
            onClick={() => onPick(place)}
          >
            <span className="font-medium text-base">
              {place.displayName?.text}
            </span>
          </li>
        ))}
        {places.length === 0 && (
          <li className="p-8 text-center text-muted-foreground">Result not Found</li>
        )}
      </ul>
    </div>
  );
}
