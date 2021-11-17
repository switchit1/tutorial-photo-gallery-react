import { useState, useEffect } from "react";
import { isPlatform } from '@ionic/react';


import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Storage } from '@capacitor/storage'

const PHOTO_STORAGE = "photos";
export function usePhotoGallery() {

  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  useEffect(() => {
    const loadSaved = async () => {
      const { value } = await Storage.get({ key: PHOTO_STORAGE });

      const photosInStorage = (value ? JSON.parse(value) : []) as UserPhoto[];
      // If running on the web...
      if (!isPlatform('hybrid')) {
        for (let photo of photosInStorage) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data
          });
          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
      }
      setPhotos(photosInStorage);
    };
    loadSaved();
  }, []);

  const takePhoto = async () => {
    const cameraPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 100,
      saveToGallery: true
    });
    const fileName = new Date().getTime() + '.jpeg';
    const newPhotos = [{
      filepath: fileName,
      webviewPath: cameraPhoto.webPath,
    }, ...photos];
    setPhotos(newPhotos);
    Storage.set({key: PHOTO_STORAGE,value: JSON.stringify(newPhotos)});
  };

  return {
    photos,
    takePhoto
  };
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject('method did not return a string')
      }
    };
    reader.readAsDataURL(blob);
  });
}
