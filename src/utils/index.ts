import { Injectable } from '@nestjs/common';
import { Client, Collection, Message, TextChannel } from 'discord.js';

@Injectable()
export class DiscordUtils {
  public constructor(private readonly client: Client) {}

  /**
   * Busca canais de texto na guilda
   * @param channelName Nome do canal a ser procurado
   * @returns O primeiro {@link TextChannel} com o nome correspondente
   */
  findChannel(channelName: string) {
    const channel = this.client.channels.cache.find((c) => {
      if (!(c instanceof TextChannel)) return false;
      return c.name === channelName;
    });
    if (channel instanceof TextChannel) return channel;
  }

  /**
   * Função para limpar canal para fins de manutenção
   * @param channel {@link TextChannel} para limpar
   * @returns O número de mensagens deletadas com sucesso
   */
  async cleanChannel(channel: TextChannel) {
    let messageQuantity = 0;
    let fetched: Collection<string, Message>;
    do {
      fetched = await channel.messages.fetch({ limit: 100 });
      fetched = fetched.filter((message) => !message.pinned);
      messageQuantity += fetched.size;
      await channel.bulkDelete(fetched);
    } while (fetched.size > 2);
    return messageQuantity;
  }
}
