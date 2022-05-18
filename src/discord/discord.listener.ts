import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DiscordUtils } from 'src/utils';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from '@nestjs/config';
import { format, utcToZonedTime } from 'date-fns-tz';
import { theme } from 'src/config/theme';

@Injectable()
export class DiscordListener {
  private readonly appLogger = new Logger(DiscordListener.name);
  private readonly tasksLogger = new Logger(`${DiscordListener.name} - Tasks`);

  public constructor(
    private readonly client: Client,
    private readonly utils: DiscordUtils,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.appLogger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.appLogger.warn(message);
  }

  async cleanChannels(channelList: string[]) {
    const channels = channelList.map((c) => this.utils.findChannel(c));
    channels.map((c) => {
      this.utils
        .cleanChannel(c)
        .then((messagesCleaned) =>
          this.tasksLogger.log(
            `Cleaned ${messagesCleaned} from ${c.name} channel.`,
          ),
        );
    });
    return channels;
  }

  @Cron('0 0 * * *', { timeZone: 'America/Maceio' })
  cleanCommandChannel() {
    return this.cleanChannels(['magias-de-comando']);
  }
  @Cron('0 4 * * *', { timeZone: 'America/Maceio' })
  cleanBrothelChannel() {
    return this.cleanChannels(['roletagens', 'outros']);
  }
  @Cron(CronExpression.EVERY_10_SECONDS)
  async podiumSystem() {
    const channels = await this.cleanChannels(['podium']);
    const usersData = await this.prisma.user.findMany({
      orderBy: { balance: 'desc' },
      select: { balance: true, id: true },
    });
    const { members } = await this.client.guilds.cache.get(
      this.config.get('DISCORD_GUILD'),
    );
    const leaderboards = usersData.map(async (user) => {
      const memberData = await members.cache.get(user.id);
      const { user: guildUserData } = memberData;
      return { ...user, username: guildUserData.username };
    });
    const playersData = await Promise.all(leaderboards);
    const updatedDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss', {
      timeZone: 'America/Maceio',
    });

    await channels[0].send({
      embeds: [
        new MessageEmbed({
          title: '🏆 Ranque',
          color: theme.default,
          footer: { text: `Pódio atualizado às ${updatedDate}` },
          description: `${playersData
            .map((p, i) => `${i + 1} - ${p.username} - ${p.balance}`)
            .join('\n')}`,
        }),
      ],
    });
  }
}
