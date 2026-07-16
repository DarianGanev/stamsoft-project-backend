import { Injectable } from '@nestjs/common';

import * as packageJson from '../package.json';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'carauction-backend',
      version: packageJson.version,
    };
  }

  getVersion() {
    return {
      service: 'carauction-backend',
      version: packageJson.version,
    };
  }
}
