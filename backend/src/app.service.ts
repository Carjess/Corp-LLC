import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'Juliam Corp LLC - Inventory Management API',
      timestamp: new Date().toISOString(),
    };
  }
}

