import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function createPlaylist(accessToken: string, userId: string, name: string, songs: string[]) {
  // Create playlist
  const playlistResponse = await fetch(
    `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        description: "Created with Concert to Playlist",
        public: true
      })
    }
  );

  if (!playlistResponse.ok) {
    throw new Error("Failed to create playlist");
  }

  const playlist = await playlistResponse.json();

  // Search for tracks
  const tracks = await Promise.all(
    songs.map(async (song) => {
      const searchResponse = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(song)}&type=track&limit=1`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        }
      );
      
      if (!searchResponse.ok) return null;
      
      const { tracks } = await searchResponse.json();
      return tracks.items[0]?.uri;
    })
  );

  // Add tracks to playlist
  const validTracks = tracks.filter(Boolean);
  if (validTracks.length) {
    await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlist.id}/tracks`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uris: validTracks
        })
      }
    );
  }

  return playlist;
}

export function useCreateSpotifyPlaylist() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, songs }: { name: string; songs: string[] }) => {
      const userResponse = await fetch("/api/auth/user");
      if (!userResponse.ok) {
        throw new Error("Not authenticated");
      }
      const user = await userResponse.json();

      const playlist = await createPlaylist(user.accessToken, user.spotifyId, name, songs);
      
      await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          spotifyId: playlist.id,
          setlistId: name
        })
      });

      return playlist;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Playlist created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  });
}
