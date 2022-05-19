import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  TextChannel,
} from 'discord.js';
import { Context, ContextOf, Once, Options, SlashCommand } from 'necord';
import { Node } from 'lavaclient';
import { Track } from '@lavaclient/types';
import { load, SpotifyItemType } from '@lavaclient/spotify';
import * as queue from '@lavaclient/queue';
import { MusicDto } from './dtos/music.dto';
import { theme } from 'src/config/theme';
import { DiscordUtils } from 'src/utils';
import { Pagination } from 'discordjs-button-embed-pagination';

const urlRegex =
  /^https?:\/\/((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;

queue.load();

@Injectable()
export class MusicService {
  private readonly musicLogger = new Logger(MusicService.name);
  private music: Node;

  constructor(
    private readonly configService: ConfigService,
    private readonly utils: DiscordUtils,
  ) {}

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.music = new Node({
      sendGatewayPayload: (id, payload) => {
        return client.guilds.cache.get(id)?.shard?.send(payload);
      },
      connection: {
        host: this.configService.get('LAVALINK_HOST'),
        password: this.configService.get('LAVALINK_PASSWORD'),
        port: this.configService.get<number>('LAVALINK_PORT'),
      },
    });

    this.music.on('connect', () => {
      this.musicLogger.log(`Lavalink connected successfully`);
    });
    client.ws.on('VOICE_SERVER_UPDATE', (data) =>
      this.music.handleVoiceUpdate(data),
    );
    client.ws.on('VOICE_STATE_UPDATE', (data) =>
      this.music.handleVoiceUpdate(data),
    );
    load({
      client: {
        id: this.configService.get('SPOTIFY_CLIENT_ID'),
        secret: this.configService.get('SPOTIFY_CLIENT_SECRET'),
      },
      autoResolveYoutubeTracks: false,
    });

    this.music.connect(client.user!.id);
  }

  @SlashCommand('play', 'Toca uma música qualquer')
  public async play(
    @Context() [interaction]: [CommandInteraction],
    @Options() { song, next = false }: MusicDto,
  ) {
    const player = this.music.createPlayer(interaction.guildId);
    let tracks: Track[];
    let playlistLength = 0;

    if (this.music.spotify.isSpotifyUrl(song)) {
      const item = await this.music.spotify.load(song);
      switch (item?.type) {
        case SpotifyItemType.Track:
          tracks = [await item.resolveYoutubeTrack()];
          break;
        case SpotifyItemType.Artist:
          tracks = await item.resolveYoutubeTracks();
          break;
        case SpotifyItemType.Album:
        case SpotifyItemType.Playlist:
          tracks = await item.resolveYoutubeTracks();
          playlistLength = tracks.length;
          break;
        default:
          return interaction.reply({
            content: "Sorry, couldn't find anything :/",
          });
      }
    } else {
      const searchTerm = urlRegex.test(song) ? song : `ytsearch:${song}`;
      const search = await this.music.rest.loadTracks(searchTerm);
      switch (search.loadType) {
        case 'PLAYLIST_LOADED':
          tracks = search.tracks;
          playlistLength = tracks.length;
          break;
        case 'TRACK_LOADED':
        case 'SEARCH_RESULT':
          tracks = [search.tracks[0]];
          break;
      }
    }

    player.queue.add(tracks, { requester: interaction.user.id, next });

    if (tracks.length) {
      const track = tracks[0];
      const songName = `[${track.info.title}](${track.info.uri})`;
      const songAuthor = track.info.author;
      if (playlistLength) {
        await interaction.reply({
          embeds: [
            new MessageEmbed({
              title: `🎵 ${`Adicionado ${playlistLength} músicas a fila!`}`,
              color: theme.default,
            }),
          ],
        });
      } else {
        await interaction.reply({
          embeds: [
            new MessageEmbed({
              title: `🎵 ${
                !player.playing ? 'Tocando agora' : 'Adicionado a fila'
              }:`,
              fields: [
                { inline: true, name: 'Música', value: songName },
                { inline: true, name: 'Autor', value: songAuthor },
                {
                  inline: true,
                  name: 'Duração',
                  value: this.utils.msToHMS(track.info.length),
                },
              ],
              color: theme.default,
            }),
          ],
        });
      }
    }

    if (!player.connected && interaction.member instanceof GuildMember) {
      player.connect(interaction.member.voice.channelId, { deafened: true });
    }
    if (!player.playing) {
      await player.queue.start();
    }
  }

  @SlashCommand('queue', 'Mostra a fila do player')
  public async queue(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    if (player.queue.tracks.length) {
      const tracks = player.queue.tracks;
      const pages = this.utils
        .spliceIntoChunks(tracks, 10)
        .map((chunk, page) => {
          return new MessageEmbed({
            title: '📜 Fila',
            color: theme.default,
            fields: chunk.map(({ title, author, length }, index) => {
              return {
                name: `${++index + page * 10}) ${title} - ${author}`,
                value: `Duração: \`${this.utils.msToHMS(length)}\``,
              };
            }),
          });
        });
      await new Pagination(
        interaction.channel as TextChannel,
        pages,
      ).paginate();
      return interaction.reply('Fila a seguir:');
    }
  }

  @SlashCommand('skip', 'Pula a música atual')
  async skip(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    player.queue.next().then((skipped) => {
      if (skipped) return interaction.reply('Pulei 👍');
      player.disconnect();
      player.destroy();
      return interaction.reply('A fila acabou... 😩');
    });
  }

  @SlashCommand('leave', 'Para a música e desconecta o bot')
  async leave(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    player.disconnect();
    player.destroy();
    await interaction.reply('✅');
  }

  @SlashCommand('pause', 'Pausa a música atual')
  async pause(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    const isPlaying = player.playing;
    await player.pause(isPlaying);
    await interaction.reply(isPlaying ? 'Pausei ⏸' : 'Despausei ▶️');
  }

  @SlashCommand('loop', 'Coloca a fila em loop')
  async loop(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    const { queue: playerQueue } = player;
    const isLooping = playerQueue.loop.type === queue.LoopType.Queue;
    await playerQueue.setLoop(
      isLooping ? queue.LoopType.None : queue.LoopType.Queue,
    );
    await interaction.reply(isLooping ? 'Em Loop 🔁' : 'Tirei do Loop ⏯️');
  }

  @SlashCommand('shuffle', 'Aleatoria a fila de música')
  async shuffle(@Context() [interaction]: [CommandInteraction]) {
    const player = this.music.players.get(interaction.guildId);
    player.queue.shuffle();
    await interaction.reply('Aleatorizado 👍');
  }
}
