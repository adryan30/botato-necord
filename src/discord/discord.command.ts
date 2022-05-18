import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';
import { Context, SlashCommand } from 'necord';
import { DiscordService } from './discord.service';

@Injectable()
export class DiscordCommand {
  constructor(private readonly discordService: DiscordService) {}

  @SlashCommand('ping', 'Ping-Pong Command')
  public async onPing(@Context() [interaction]: [CommandInteraction]) {
    return this.discordService.ping(interaction);
  }
}
