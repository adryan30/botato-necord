import { Injectable } from '@nestjs/common';
import { CommandInteraction } from 'discord.js';
import { Context, Options, SlashCommand } from 'necord';
import { PrefixDto } from './dtos/prefix.dto';

@Injectable()
export class PrefixService {
  constructor() {}

  @SlashCommand('prefix', 'Adiciona um prefixo ao nome')
  public async changePrefix(
    @Context() [interaction]: [CommandInteraction],
    @Options() { prefix }: PrefixDto,
  ) {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const oldNickname = member.displayName;
    const newName = `[${prefix}] ${oldNickname}`;
    await member.setNickname(newName).catch((err) => console.error(err));
    return interaction.reply({
      content: `Seu nome agora é ${newName}`,
      ephemeral: true,
    });
  }

  @SlashCommand('rp', 'Remove o prefixo do nome')
  public async removePrefix(@Context() [interaction]: [CommandInteraction]) {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const oldNickname = member.displayName;
    await member.setNickname(oldNickname.replace(/\[.*]\s/, ''));
    return interaction.reply({
      content: `O prefixo foi retirado de seu nome`,
      ephemeral: true,
    });
  }
}
