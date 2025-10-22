export class WordDto {
  text: string;
  confidence: number;
}

export class OcrDataDto {
  text: string;
  confidence: number;
  words?: WordDto[];
  fileName?: string;
  fileSize?: number;
  language?: string;
  url?: string;
}

export class OcrResponseDto {
  success: boolean;
  message: string;
  data: OcrDataDto | OcrDataDto[];
}

export class ErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}