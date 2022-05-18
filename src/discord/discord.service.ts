import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';
import { Context, SlashCommand } from 'necord';

@Injectable()
export class DiscordService {
  constructor() {}

  @SlashCommand('ping', 'Ping-Pong Command')
  public async onPing(@Context() [interaction]: [CommandInteraction]) {
    return interaction.reply({ content: 'Pong!' });
  }
}
