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
    `/api/setlists/search?artistName=${encodeURIComponent(query)}`,
    {
      headers: {
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch setlists");
  }

  const data = await response.json();
  return data.setlist || [];
}