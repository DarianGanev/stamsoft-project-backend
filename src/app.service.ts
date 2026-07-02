import { Injectable } from '@nestjs/common';

import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(private readonly usersService: UsersService) {}

  async getHealth() {
    const [total, recent] = await Promise.all([
      this.usersService.countUsers(),
      this.usersService.findRecentUsers(),
    ]);

    return {
      status: 'ok',
      service: 'carauction-backend',
      accounts: {
        total,
        recent,
      },
    };
  }
}
