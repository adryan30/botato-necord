import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client, TextChannel } from 'discord.js';
import { Cron } from '@nestjs/schedule';
import { DiscordUtils } from 'src/utils';

@Injectable()
export class DiscordListener {
  private readonly appLogger = new Logger(DiscordListener.name);
  private readonly tasksLogger = new Logger(`${DiscordListener.name} - Tasks`);

  public constructor(
    private readonly client: Client,
    private readonly utils: DiscordUtils,
  ) {}

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.appLogger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.appLogger.warn(message);
  }

  @Cron('0 0 * * *', { timeZone: 'America/Maceio' })
  cleanCommandChannel() {
    const CHANNEL_NAME = 'magias-de-comando';
    const channel = this.utils.findChannel(CHANNEL_NAME);
    return this.utils.cleanChannel(channel).then((messagesCleaned) => {
      `Cleaned ${messagesCleaned} from ${CHANNEL_NAME} channel.`;
    });
  }
}
