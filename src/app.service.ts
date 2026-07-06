import { Injectable } from '@nestjs/common';

const BACKEND_VERSION = '0.1.0';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'carauction-backend',
      version: BACKEND_VERSION,
    };
  }
}
