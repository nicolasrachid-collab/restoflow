import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdateRestaurantConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  queueActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPartySize?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(300)
  averageTableTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  calledTimeoutMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  minReservationAdvanceHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxReservationAdvanceDays?: number;
}

