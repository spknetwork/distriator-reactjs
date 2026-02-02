import { useState } from "react";
import { PlacesService, type Place } from "../../../services/places-service";

interface DialogProps {
    title: string;
    onClose: () => void;
    onSubmit: (places: Place[]) => void;
    latitude?: number;
    longitude?: number;
    token?: string;
}

export function Dialog({ title, onClose, onSubmit, latitude, longitude, token }: DialogProps) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!value.trim()) return;
        setLoading(true);
        setError("");
        try {
            if (!latitude || !longitude || !token) throw new Error("Missing location or token");
            const places = await PlacesService.getPlaces(value.trim(), latitude, longitude, token);
            if (!Array.isArray(places) || places.length === 0) {
                setError("Koi result nahi mila. Dusra naam try karo.");
                setLoading(false);
                return;
            }
            onSubmit(places);
        } catch (e: any) {
            setError(e.message || "Kuch gadbad hai. Fir se try karo.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            {/* Modal container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl border border-gray-800">
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {title}
                    </h2>

                    {/* Input */}
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enter place name"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1"
                    />
                    {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center"
                            disabled={loading}
                        >
                            {loading ? <span className="loader w-4 h-4 border-b-2 border-white rounded-full animate-spin inline-block mr-2"></span> : null}
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
