import * as FileSystem from 'expo-file-system/legacy';

import type { AstroPhotoStore, PendingAstroPhoto } from '../model/astrophoto-sync.ts';

const directory = `${FileSystem.documentDirectory}pending-astrophotos`;
const queueUri = `${directory}/queue.json`;

export class ExpoAstroPhotoStore implements AstroPhotoStore {
  async persist(photo: PendingAstroPhoto): Promise<PendingAstroPhoto> {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const durable = { ...photo, uri: `${directory}/${photo.photoId}.jpg` };
    await FileSystem.copyAsync({ from: photo.uri, to: durable.uri });
    try {
      const queued = await this.list();
      await writeQueue([...queued.filter((item) => item.photoId !== photo.photoId), durable]);
      return durable;
    } catch (error) {
      await FileSystem.deleteAsync(durable.uri, { idempotent: true });
      throw error;
    }
  }

  async list(): Promise<PendingAstroPhoto[]> {
    const info = await FileSystem.getInfoAsync(queueUri);
    if (!info.exists) return [];
    try {
      const candidate = JSON.parse(await FileSystem.readAsStringAsync(queueUri));
      return Array.isArray(candidate) ? (candidate as PendingAstroPhoto[]) : [];
    } catch {
      return [];
    }
  }

  async remove(photo: PendingAstroPhoto): Promise<void> {
    await writeQueue((await this.list()).filter((item) => item.photoId !== photo.photoId));
    await FileSystem.deleteAsync(photo.uri, { idempotent: true });
  }
}

async function writeQueue(queue: PendingAstroPhoto[]): Promise<void> {
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  await FileSystem.writeAsStringAsync(queueUri, JSON.stringify(queue));
}
