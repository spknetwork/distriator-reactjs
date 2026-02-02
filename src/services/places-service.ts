export interface Place {
  internationalPhoneNumber?: string;
  addressComponents?: any[];
  location?: { latitude: number; longitude: number };
  displayName: { text: string };
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: any[];
}

export const PlacesService = {
  async getPlaces(query: string, latitude: number, longitude: number, token: string): Promise<Place[]> {
    const resp = await fetch(
      "https://beta-api.distriator.com/places",
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, latitude, longitude }),
      }
    );
    if (!resp.ok) {
      throw new Error("Failed to get places");
    }
    const result = await resp.json();
    return result?.places || [];
  },

  async getPhotoUrl(photoUri: string, token: string): Promise<string> {
    const resp = await fetch("https://beta-api.distriator.com/places/photo", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photoUri }),
    });
    if (!resp.ok) {
      throw new Error("Failed to fetch photo url");
    }
    const json = await resp.json();
    return json.url;
  }
};