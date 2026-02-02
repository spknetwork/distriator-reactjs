import { KeyTypes } from "@aioha/aioha";
import type { AiohaOperations } from "@aioha/aioha/build/providers/provider";
import { handleTokenExpiration } from '../utils/auth-utils';

export interface UploadResponse {
  success: boolean;
  url: string | null;
  message: string;
}

export class ImageUploadService {
  static async signAndUploadImage(
    aioha: AiohaOperations,
    uploadUrlServer: string,
    fileName: string,
    fileBytes: Uint8List,
    username: string,
  ): Promise<UploadResponse> {
    try {
      const timeStamp = Math.floor(Date.now() / 1000);

      const object = {
        signed_message: { type: "posting", app: "ecency.app" },
        authors: [username],
        timestamp: timeStamp,
      };

      // Sign the message
      const resultOfSignature = await aioha.signMessage(
        JSON.stringify(object),
        KeyTypes.Posting
      );

      if (resultOfSignature.success === true) {
        const objectWithSignature = {
          ...object,
          signatures: [resultOfSignature.result]
        };

        const base64StringOfObject = this.toBase64(JSON.stringify(objectWithSignature));

        // Upload the image
        const uploadResult = await this.uploadImage(
          fileBytes,
          fileName,
          base64StringOfObject,
          uploadUrlServer
        );

        return uploadResult;
      } else {
        return {
          success: false,
          url: null,
          message: `Failed to sign image: ${resultOfSignature.error || 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        url: null,
        message: `Error in signAndUploadImage: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async uploadImage(
    imageBytes: Uint8Array,
    fileName: string,
    token: string,
    uploadUrlServer: string
  ): Promise<UploadResponse> {
    try {
      const encodedToken = encodeURIComponent(token);
      const url = `${uploadUrlServer}/${encodedToken}`;

      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Create a Blob from the Uint8Array
      const blob = new Blob([new Uint8Array(imageBytes)], { 
        type: this.getMimeType(fileName) 
      });
      
      formData.append('file', blob, fileName);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return {
          success: false,
          url: null,
          message: 'Token expired'
        };
      }

      if (response.ok) {
        const resJson = await response.json();
        const uploadUrl = resJson.url;

        return {
          success: true,
          url: uploadUrl,
          message: 'Image uploaded successfully.'
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          url: null,
          message: `Upload failed: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        url: null,
        message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static toBase64(input: string): string {
    return btoa(unescape(encodeURIComponent(input)));
  }

  static getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

// Type definition for Uint8Array (equivalent to Uint8List in Dart)
export type Uint8List = Uint8Array;