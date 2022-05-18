import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';

@Injectable()
export class DiscordService {
  ping(interaction: CommandInteraction) {
    return interaction.reply({ content: 'Pong!' });
  }
}
