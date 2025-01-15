import type { Setlist } from "@/lib/setlist";
import { useCreateSpotifyPlaylist } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parse, format } from "date-fns";
import { Music, MapPin } from "lucide-react";

interface SetlistDisplayProps {
  setlists: Setlist[];
  selectedSetlist: string | null;
  onSelectSetlist: (id: string) => void;
  user: any;
}

export function SetlistDisplay({ 
  setlists, 
  selectedSetlist,
  onSelectSetlist,
  user 
}: SetlistDisplayProps) {
  const createPlaylist = useCreateSpotifyPlaylist();

  const handleCreatePlaylist = async (setlist: Setlist) => {
    const songs = setlist.sets.set
      .flatMap(set => set.song)
      .map(song => `${setlist.artist.name} ${song.name}`);

    const name = `${setlist.artist.name} @ ${setlist.venue.name} - ${setlist.eventDate}`;

    createPlaylist.mutate({ name, songs });
  };

  const formatEventDate = (dateStr: string) => {
    try {
      // Parse the date string (format: "DD-MM-YYYY")
      const parsedDate = parse(dateStr, "dd-MM-yyyy", new Date());
      return format(parsedDate, "MMMM d, yyyy");
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
      return dateStr; // Return original string if parsing fails
    }
  };

  return (
    <ScrollArea className="h-[600px] mt-6">
      <div className="space-y-4">
        {setlists.map((setlist) => (
          <Card
            key={setlist.id}
            className={selectedSetlist === setlist.id ? "border-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{setlist.artist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(setlist.eventDate)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    {setlist.venue.name}, {setlist.venue.city.name}
                  </div>
                </div>
                {user && (
                  <Button
                    onClick={() => handleCreatePlaylist(setlist)}
                    disabled={createPlaylist.isPending}
                  >
                    Create Playlist
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {setlist.sets.set.map((set, index) => (
                  <div key={index}>
                    {set.song.map((song, songIndex) => (
                      <div
                        key={songIndex}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <Music className="h-4 w-4 text-muted-foreground" />
                        {song.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}