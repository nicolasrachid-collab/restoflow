import { IsNotEmpty, IsInt, Min, Max, IsBoolean, IsString, Matches, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class OperatingHoursItemDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=domingo, 6=sábado

  @IsNotEmpty()
  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime deve estar no formato HH:mm (ex: 09:00)',
  })
  openTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime deve estar no formato HH:mm (ex: 22:00)',
  })
  closeTime?: string;
}

export class UpdateOperatingHoursDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursItemDto)
  hours: OperatingHoursItemDto[];
}

