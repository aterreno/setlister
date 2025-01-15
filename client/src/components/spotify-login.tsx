import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";
import { getBaseUrl } from "@/lib/utils";

interface SpotifyLoginProps {
  className?: string;
}

export function SpotifyLogin({ className }: SpotifyLoginProps) {
  const handleLogin = () => {
    const baseUrl = getBaseUrl();
    window.location.href = `${baseUrl}/api/auth/spotify`;
  };

  return (
    <div className={className}>
      <Button
        className="w-full"
        variant="outline"
        onClick={handleLogin}
      >
        <SiSpotify className="mr-2 h-5 w-5" />
        Login with Spotify to Create Playlists
      </Button>
    </div>
  );
}