import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents } from 'discord.js';
import { NecordModule } from 'necord';
import { DiscordUtils } from 'src/utils';
import { DiscordService } from './discord.service';
import { MusicService } from './modules/music.service';
import { PrefixService } from './modules/prefix.service';
import { RoleService } from './modules/role.service';

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
        development: [configService.get('DISCORD_GUILD')],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    DiscordService,
    DiscordUtils,
    DiscordService,
    PrefixService,
    RoleService,
    MusicService,
  ],
})
export class DiscordModule {}
