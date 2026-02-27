import { Controller, Global, Injectable } from "@nestjs/common";

import { MessagePattern } from "@nestjs/microservices";
import { UserService } from "../../application/user.service";

type UserByUserIdEvent = {
  user_id: string;
};

type UsersByUserIdsEvent = {
  userIds: string[];
};

@Global()
@Controller()
export class UserRqmListener {
  constructor(private readonly userService: UserService) {}

  @MessagePattern("user.getAllByUserRoleId", { async: true })
  async handleGetAllUserByUserRoleId(event: UsersByUserIdsEvent) {
    const { userIds } = event;
    return await this.userService.findByUserIds(userIds);
  }

  @MessagePattern("user.getById", { async: true })
  async handleGetUserById(event: UserByUserIdEvent) {
    const { user_id } = event;
    return this.userService.findById(user_id);
  }
}
