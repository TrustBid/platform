import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Roles asignables desde la UI.
 *
 * Son exactamente los del enum `user_role` en la base. El diseño también
 * contempla "Contador" y "Auditor", pero no existen como rol ni tienen
 * restricciones implementadas: crearlos sin eso les daría escritura sobre todo
 * endpoint que no esté marcado @Roles('admin').
 */
const ASSIGNABLE_ROLES = ['admin', 'responsable', 'donante'] as const;

export class UpdateOrgUserDto {
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class NotificationPreferenceDto {
  @IsString()
  @MaxLength(64)
  eventKey: string;

  @IsIn(['email', 'whatsapp'])
  channel: string;

  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceDto)
  preferences: NotificationPreferenceDto[];
}
