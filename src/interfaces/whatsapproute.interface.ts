export interface IRouteResponse {
  success?: boolean;
  [key: string]: any;
}

export interface MediaUploadOptions {
  routeId: number;
  file?: Express.Multer.File; // From multer upload
  fileBuffer?: Buffer; // Direct buffer
  fileUrl?: string; // Download from URL
  mimeType: string;
  filename?: string;
}


export interface UploadMediaResponse {
  id: string; // Media ID from WhatsApp
}