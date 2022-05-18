import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents } from 'discord.js';
import { NecordModule } from 'necord';
import { DiscordUtils } from 'src/utils';
import { DiscordCommand } from './discord.command';
import { DiscordListener } from './discord.listener';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get('DISCORD_TOKEN'),
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_PRESENCES,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_VOICE_STATES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        ],
        development: ['871755122911367208'],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [DiscordCommand, DiscordService, DiscordListener, DiscordUtils],
})
export class DiscordModule {}
