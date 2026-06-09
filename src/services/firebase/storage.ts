import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const uploadImage = async (
  uri: string,
  path: string,
  maxWidth = 800
): Promise<string> => {
  // Compress image
  const compressed = await manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  const response = await fetch(compressed.uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
};

export const uploadBabyPhoto = async (babyId: string, uri: string): Promise<string> => {
  return uploadImage(uri, `babies/${babyId}/profile.jpg`);
};

export const uploadJournalPhoto = async (
  babyId: string,
  entryId: string,
  photoIndex: number,
  uri: string
): Promise<string> => {
  return uploadImage(uri, `journal/${babyId}/${entryId}/photo_${photoIndex}.jpg`);
};

export const uploadVaccineCertificate = async (
  babyId: string,
  vaccineId: string,
  uri: string
): Promise<string> => {
  return uploadImage(uri, `vaccines/${babyId}/${vaccineId}_cert.jpg`);
};

export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
