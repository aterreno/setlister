import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { SetlistDisplay } from "@/components/setlist-display";
import { SpotifyLogin } from "@/components/spotify-login";
import { searchSetlists } from "@/lib/setlist";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: setlists, isLoading } = useQuery({
    queryKey: ["setlists", query],
    queryFn: () => searchSetlists(query),
    enabled: query.length > 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="h-[40vh] bg-cover bg-center relative" 
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1493308903033-e622ac815e5d)',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(0,0,0,0.6)'
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            Concert to Playlist
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl">
            Turn your favorite concert setlists into Spotify playlists instantly
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 -mt-8">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <SearchBar 
              onSearch={setQuery}
              isLoading={isLoading}
            />

            {!user && <SpotifyLogin className="mt-6" />}

            {setlists && (
              <SetlistDisplay
                setlists={setlists}
                selectedSetlist={selectedSetlist}
                onSelectSetlist={setSelectedSetlist}
                user={user}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
