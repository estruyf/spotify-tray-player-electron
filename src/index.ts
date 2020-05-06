import { app, Menu, Tray, nativeImage, NativeImage, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import { Spotify } from './services';

const assetsDirectory = path.join(__dirname, '../assets');

const createImage = (fileName: string): NativeImage => {
  const image = nativeImage.createFromPath(path.join(assetsDirectory, fileName));
  image.isMacTemplateImage = true;
  return image;
};

app.on('ready', () => {
  const tray = new Tray(createImage('spotify.png'));

  const menuItems: MenuItemConstructorOptions[] = [{ label: 'Quit', click: () => app.quit() }];

  tray.setToolTip('Spotify tray player');

  const toggle = async () => {
    await Spotify.toggle();
    setIcon();
  };

  const setIcon = () => {
    setTimeout(async () => {
      const song = await Spotify.getState();
      if (song && song.state === "playing") {
        tray.setImage(createImage('music.png'));
      } else {
        tray.setImage(createImage('spotify.png'));
      }
    }, 500);
  };

  const scheduler = () => {
    setIcon();

    setTimeout(() => {
      scheduler();
    }, 1 * 60 * 1000); // Every minute
  };

  tray.on('click', async (event) => {
    toggle();
  });

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
    }

    if (ctxMenuItems.length > 0) {
      ctxMenuItems.push({ type: 'separator' });
    }
    
    const ctxMenu = Menu.buildFromTemplate([...ctxMenuItems, ...menuItems]);
    tray.popUpContextMenu(ctxMenu);
  });

  // Run a job to verify if Spotify is still playing
  scheduler();
});

app.dock.hide();