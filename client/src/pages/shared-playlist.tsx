import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Music } from "lucide-react";
import { useParams } from "wouter";

export default function SharedPlaylist() {
  const [, params] = useParams();
  const shareId = params.shareId;

  const { data: playlist, isLoading, error } = useQuery({
    queryKey: [`/api/shared/${shareId}`],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Playlist Not Found</h1>
              <p className="text-muted-foreground">
                This shared playlist might have been removed or made private.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground">{playlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Shared {playlist.shareCount} times
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {playlist.tracks.map((track: any, index: number) => (
                <div
                  key={track.track.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {track.track.name} - {track.track.artists[0].name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
