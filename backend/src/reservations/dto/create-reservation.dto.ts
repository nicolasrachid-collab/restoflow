import { IsString, IsEmail, IsInt, Min, Max, IsOptional, IsDateString, Matches } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  customerName: string;

  @IsString()
  @Matches(/^[\d\s\(\)\-\+]+$/, { message: 'Telefone deve conter apenas números, espaços, parênteses, hífens e sinais de mais' })
  phone: string;

  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @IsInt()
  @Min(1, { message: 'Número de pessoas deve ser pelo menos 1' })
  partySize: number;

  @IsDateString({}, { message: 'Data deve ser uma data válida' })
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}

