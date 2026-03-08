import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import type { Attachment } from "@/types";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Upload a file to Firebase Storage.
 * @param basePath  e.g. "households/hid/shoppingItems/itemId"
 */
export function uploadAttachment(
  basePath: string,
  file: File,
  onProgress: (pct: number) => void
): { promise: Promise<Attachment>; cancel: () => void } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      promise: Promise.reject(new Error("File exceeds 25 MB limit")),
      cancel: () => {},
    };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const uid = crypto.randomUUID();
  const path = `${basePath}/${uid}${ext ? `.${ext}` : ""}`;
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: { originalName: file.name },
  });

  const promise = new Promise<Attachment>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            url,
            path,
            uploadedAt: new Date().toISOString(),
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  return { promise, cancel: () => uploadTask.cancel() };
}

export async function deleteAttachment(path: string): Promise<void> {
  await deleteObject(ref(storage, path));
}
