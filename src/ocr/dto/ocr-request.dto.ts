import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

export enum LanguageEnum {
  THAI = 'tha',
  ENGLISH = 'eng',
  THAI_ENGLISH = 'tha+eng',
  CHINESE_SIMPLIFIED = 'chi_sim',
  CHINESE_TRADITIONAL = 'chi_tra',
  JAPANESE = 'jpn',
  KOREAN = 'kor',
  FRENCH = 'fra',
  GERMAN = 'deu',
  SPANISH = 'spa',
}

export class ProcessBase64Dto {
  @IsString()
  image: string;

  @IsOptional()
  @IsEnum(LanguageEnum, {
    message:
      'ภาษาไม่ถูกต้อง กรุณาเลือกจาก: tha, eng, tha+eng, chi_sim, chi_tra, jpn, kor, fra, deu, spa',
  })
  language?: LanguageEnum;
}

export class ProcessUrlDto {
  @IsUrl({}, { message: 'URL ไม่ถูกต้อง' })
  @IsString()
  url: string;

  @IsOptional()
  @IsEnum(LanguageEnum, {
    message:
      'ภาษาไม่ถูกต้อง กรุณาเลือกจาก: tha, eng, tha+eng, chi_sim, chi_tra, jpn, kor, fra, deu, spa',
  })
  language?: LanguageEnum;
}
