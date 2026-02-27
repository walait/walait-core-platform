import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { hash } from "argon2";
import { EntityManager, In, type Repository } from "typeorm";
import { User } from "../domain/model/user.entity";
import { SignUpInput } from "../interfaces/schemas/auth.schema";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async findAll() {
    return this.userRepository.find({
      relations: ["userRoles", "userRoles.role", "userRoles.organization"],
    });
  }
  async findById(userId: string, populate = false) {
    return this.userRepository.findOne({
      where: { id: userId },
      ...(populate
        ? {
            relations: [
              "userRoles",
              "userRoles.role",
              "userRoles.role.rolePermissions",
              "userRoles.role.rolePermissions.permission",
            ],
          }
        : {}),
      select: ["id"],
    });
  }

  async findByUserIds(userIds: string[]) {
    return this.userRepository.find({
      where: { id: In(userIds) },
    });
  }

  async findByEmail(email: string, withPassword = false) {
    return this.userRepository.findOne({
      where: { email },
      select: withPassword
        ? [
            "id",
            "email",
            "password_hash",
            "is_email_verified",
            "first_name",
            "last_name",
            "avatar_url",
            "metadata",
          ]
        : [
            "id",
            "email",
            "is_email_verified",
            "first_name",
            "last_name",
            "avatar_url",
            "metadata",
          ],
    });
  }

  async existsByEmail(email: string) {
    return !!(await this.userRepository.findOne({ where: { email } }));
  }

  toResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      metadata: user.metadata,
    };
  }

  async createUser(data: SignUpInput) {
    const hashedPassword = await hash(data.password);

    const user = this.userRepository.create({
      email: data.email,
      password_hash: hashedPassword,
      avatar_url: data.avatar_url,
      metadata: data.metadata,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    return this.userRepository.save(user);
  }

  async updateUser(user: User) {
    const existingUser = await this.userRepository.findOneByOrFail({
      id: user.id,
    });

    // Actualizar solo los campos que se permiten modificar
    if (user.first_name) {
      existingUser.first_name = user.first_name;
    }

    if (user.last_name) {
      existingUser.last_name = user.last_name;
    }
    existingUser.avatar_url = user.avatar_url;
    existingUser.metadata = user.metadata;
    existingUser.is_email_verified = user.is_email_verified;
    if (user.password_hash) {
      existingUser.password_hash = user.password_hash;
    }

    return this.userRepository.save(existingUser);
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.is_suspended = true;
    user.deleted_at = new Date();
    user.updated_at = new Date();
    user.email = `deleted-${user.email}`; // Opcional: anonimizar el email

    // Eliminar el usuario y sus relaciones
    await this.userRepository.save(user);
    return { message: "User deleted successfully" };
  }
}
