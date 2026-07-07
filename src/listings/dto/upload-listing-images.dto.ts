import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadListingImagesDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  firstImageIsPrimary?: boolean;
}
