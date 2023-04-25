import { Role } from '../service/role';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const RolesAllowed = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
