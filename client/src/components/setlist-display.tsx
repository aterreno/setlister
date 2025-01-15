import type { Setlist } from "@/lib/setlist";
import { useCreateSpotifyPlaylist, useSharePlaylist } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parse, format } from "date-fns";
import { Music, MapPin, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const sharePlaylist = useSharePlaylist();
  const { toast } = useToast();

  const handleCreatePlaylist = async (setlist: Setlist) => {
    const songs = setlist.sets.set
      .flatMap(set => set.song)
      .map(song => `${setlist.artist.name} ${song.name}`);

    const name = `${setlist.artist.name} @ ${setlist.venue.name} - ${setlist.eventDate}`;

    try {
      const playlist = await createPlaylist.mutateAsync({ name, songs });

      // After successful creation, show share button
      toast({
        title: "Success!",
        description: "Playlist created successfully. Click share to share it with others!",
      });

      return playlist;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  };

  const handleSharePlaylist = async (playlistId: number) => {
    try {
      const { shareUrl } = await sharePlaylist.mutateAsync(playlistId);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Share link copied!",
        description: "Playlist share link has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share playlist",
        variant: "destructive"
      });
    }
  };

  const formatEventDate = (dateStr: string) => {
    try {
      const parsedDate = parse(dateStr, "dd-MM-yyyy", new Date());
      return format(parsedDate, "MMMM d, yyyy");
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
      return dateStr;
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
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCreatePlaylist(setlist)}
                      disabled={createPlaylist.isPending}
                    >
                      Create Playlist
                    </Button>
                    {createPlaylist.data && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSharePlaylist(createPlaylist.data.id)}
                        disabled={sharePlaylist.isPending}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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