import { app, Menu, Tray, nativeImage, NativeImage, MenuItemConstructorOptions } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import { Spotify } from './services';

const appName = 'spotify.tray.player';
const assetsDirectory = path.join(__dirname, '../assets');

const createImage = (fileName: string): NativeImage => {
  const image = nativeImage.createFromPath(path.join(assetsDirectory, fileName));
  image.isMacTemplateImage = true;
  return image;
};

app.on('ready', () => {
  let playTimeout: NodeJS.Timeout = null;
  let store = new Store();
  const tray = new Tray(createImage('spotify.png'));

  const menuItems: MenuItemConstructorOptions[] = [{ label: 'Quit', click: () => app.quit() }];

  tray.setToolTip('Spotify tray player');

  /**
   * Toggle player
   */
  const toggle = async () => {
    await Spotify.toggle();
    setIcon();
  };

  /**
   * Play the next song
   */
  const next = async () => {
    await Spotify.next();
    setIcon();
  }

  /**
   * Set the tray icon
   */
  const setIcon = () => {
    setTimeout(async () => {
      const song = await Spotify.getState();
      if (song && song.state === "playing") {
        
        if (getTrayTitleEnabled()) {
          const track = await Spotify.getTrack();
          if (track && track.name && track.artist) {
            tray.setImage(createImage('track.png'));
            tray.setTitle(`  ${track.artist} - ${track.name}`);
            return
          }
        }
        
        tray.setImage(createImage('music.png'));
        tray.setTitle("");
      } else {
        tray.setImage(createImage('spotify.png'));
        tray.setTitle("");
      }
    }, 500);
  };

  /**
   * Schedule the background polling
   */
  const scheduler = () => {
    setIcon();

    const titleEnabled = getTrayTitleEnabled();

    setTimeout(() => {
      scheduler();
    }, 1 * (titleEnabled ? 10 : 60) * 1000); // every 10 or 60 seconds
  };

  /**
   * Returns if the tray title is enabled
   */
  const getTrayTitleEnabled = () => {
    return store.get(`${appName}.title.enabled`) || false;
  }

  /**
   * Toggle the if the song title needs to be shown
   */
  const toggleSongTitle = () => {
    store.set(`${appName}.title.enabled`, !getTrayTitleEnabled());
    setIcon();
  }

  /**
   * Single click event
   */
  tray.on('click', async (event) => {
    // For capturing double click
    playTimeout = setTimeout(() => {
      toggle()
    }, 100);
  });

  /**
   * Double click event
   */
  tray.on('double-click', (event) => {
    clearTimeout(playTimeout);
    playTimeout = null;
    next();
  });

  /**
   * Right click event
   */
  tray.on('right-click', async (event) => {
    const track = await Spotify.getTrack();
    const song = await Spotify.getState();

    let ctxMenuItems: MenuItemConstructorOptions[] = [];
    if (track) {
      if (track.artist) {
        ctxMenuItems.push({ icon: createImage('artist.png'), label: `   ${track.artist}`, enabled: false });
      }
      if (track.name) {
        ctxMenuItems.push({ icon: createImage('track.png'), label: `   ${track.name}`, enabled: false });
      }
    }

    if (song) {
      ctxMenuItems.push({ icon: song.state === "playing" ? createImage('pause.png') : createImage('play.png'), label: `   ${song.state === "playing" ? "Pause" : "Play"}`, click: toggle });
      ctxMenuItems.push({ icon: createImage('next.png'), label: `   Next song`, click: next });
    }

    if (ctxMenuItems.length > 0) {
      ctxMenuItems.push({ type: 'separator' });
    }

    ctxMenuItems.push({ label: getTrayTitleEnabled() ? 'Hide song title' : 'Show song title', click: toggleSongTitle });

    ctxMenuItems.push({ type: 'separator' });
    
    const ctxMenu = Menu.buildFromTemplate([...ctxMenuItems, ...menuItems]);
    tray.popUpContextMenu(ctxMenu);
  });

  // Run a job to verify if Spotify is still playing
  scheduler();
});

app.dock.hide();