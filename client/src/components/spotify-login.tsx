import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";

interface SpotifyLoginProps {
  className?: string;
}

export function SpotifyLogin({ className }: SpotifyLoginProps) {
  return (
    <div className={className}>
      <Button
        className="w-full"
        variant="outline"
        onClick={() => window.location.href = "/api/auth/spotify"}
      >
        <SiSpotify className="mr-2 h-5 w-5" />
        Login with Spotify to Create Playlists
      </Button>
    </div>
  );
}
