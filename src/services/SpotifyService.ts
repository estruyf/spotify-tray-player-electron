import spotify from 'spotify-node-applescript';
import { SpotifyTrack, SpotifyState } from "../models";

export class Spotify {

  /**
   * Return the current state of Spotify
   */
  public static getState(): Promise<SpotifyState | null> {
    return new Promise<SpotifyState | null>(resolve => {
      spotify.getState((err, state: SpotifyState) => {
        if (err) {
          resolve(null);
          return;
        }

        resolve(state);
      });
    });
  }


  /**
   * Returns the current track
   */
  public static getTrack(): Promise<SpotifyTrack | null> {
    return new Promise<SpotifyTrack | null>(resolve => {
      spotify.getTrack((err, track: SpotifyTrack) => {
        if (err) {
          resolve(null);
          return;
        }

        resolve(track);
      });
    });
  }

  /**
   * Toggle the state of the song
   */
  public static toggle(): Promise<SpotifyState | null> {
    return new Promise<SpotifyState | null>(resolve => {
      spotify.playPause((success: SpotifyState | null) => {
        resolve(success);
      });
    });
  }
}