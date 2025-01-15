const SETLIST_FM_API_KEY = import.meta.env.VITE_SETLIST_FM_API_KEY;
const API_BASE = "https://api.setlist.fm/rest/1.0";

export type Setlist = {
  id: string;
  eventDate: string;
  artist: {
    name: string;
    mbid: string;
  };
  venue: {
    name: string;
    city: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  sets: {
    set: Array<{
      song: Array<{
        name: string;
      }>;
    }>;
  };
};

export async function searchSetlists(query: string): Promise<Setlist[]> {
  if (!query) return [];

  const response = await fetch(
    `${API_BASE}/search/setlists?artistName=${encodeURIComponent(query)}`, 
    {
      headers: {
        "x-api-key": SETLIST_FM_API_KEY || "",
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch setlists");
  }

  const data = await response.json();
  return data.setlist || [];
}