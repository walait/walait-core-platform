import { RoleType } from "../../domain/types/role.type";
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "role";
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
