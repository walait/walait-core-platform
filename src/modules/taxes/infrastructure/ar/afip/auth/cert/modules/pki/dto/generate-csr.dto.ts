import { IsString, Length, Matches } from 'class-validator';

export class GenerateCsrDto {
  @IsString() readonly subj_o!: string; // Organización
  @IsString() readonly subj_cn!: string; // Sistema cliente

  // 11 dígitos exactos
  @Matches(/^\d{11}$/) readonly subj_cuit!: string;
}
