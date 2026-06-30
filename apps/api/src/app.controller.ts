import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from './common/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  info() {
    return {
      name: 'TrustBid API',
      version: '1.0.0',
      description: 'Fund transparency and traceability layer for NGOs on Stellar',
      chain: 'Stellar',
      network: this.config.get('STELLAR_NETWORK', 'testnet'),
      docs: 'https://trustbid-docs-site-6fp.pages.dev',
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
