export interface SpotifyState {
  track_id: string;
  volume: number;
  position: number;
  state: "playing" | "paused";
}