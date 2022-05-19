import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Client, Snowflake } from 'discord.js';
import { AppService } from './app.service';
import { DiscordUtils } from './utils';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly client: Client,
    private readonly utils: DiscordUtils,
  ) {}

  @Get('healthcheck')
  healthcheck(): string {
    return this.appService.healthcheck();
  }

  @Post(':guildId/announcement')
  announce(
    @Body('message') message: string,
    @Param('guildId') guildId: Snowflake,
  ) {
    const guild = this.client.guilds.cache.get(guildId);
    const channels = this.utils.findChannel('magias-de-comando');
    channels.send({ content: message });
  }
}
