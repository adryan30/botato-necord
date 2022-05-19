import { Injectable } from '@nestjs/common';
import {
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from 'discord.js';
import { Context, Options, SelectMenu, SlashCommand } from 'necord';

@Injectable()
export class RoleService {
  constructor() {}
  private readonly roles: MessageSelectOptionData[] = [
    {
      label: 'Aventureiro',
      value: 'Aventureiro',
      emoji: '🎲',
      description:
        'Ocasionalmente, organizamos campanhas de RPG narradas e jogadas aqui pelo Discord, caso você tenha i',
    },
    {
      label: 'Acadêmico',
      value: 'Acadêmico',
      emoji: '📕',
      description:
        'Se você é aluno do curso de Ciência da Computação da UFAL e/ou deseja ser avisado de "Coisas da UFAL',
    },
    {
      label: 'Cafetão',
      value: 'Cafetão',
      emoji: '🎰',
      description:
        'Para poder roletar suas waifus, husbandos e pokémons, reaja ao emoji de 🎰 abaixo para receber um car',
    },
  ];

  @SlashCommand('roles', 'Dá os cargos de acesso')
  public roleMenu(@Context() [interaction]: [SelectMenuInteraction]) {
    return interaction.reply({
      content: `Selecione o cargo que deseja:`,
      ephemeral: true,
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId('ROLE_MENU')
            .setPlaceholder('Cargos:')
            .setMaxValues(this.roles.length)
            .setMinValues(1)
            .setOptions(this.roles),
        ),
      ],
    });
  }

  @SelectMenu('ROLE_MENU')
  public async onSelectMenu(
    @Context() [interaction]: [SelectMenuInteraction],
    @Options() options: string[],
  ) {
    const results = await Promise.all(
      options.map(async (option) => {
        const role = interaction.guild.roles.cache.find(
          (r) => r.name === option,
        );
        await interaction.guild.members.cache
          .get(interaction.user.id)
          .roles.add(role);
        return option;
      }),
    );

    return interaction.reply({
      content: `Você ganhou os cargos ${results.join(', ')}!`,
      ephemeral: true,
    });
  }
}
