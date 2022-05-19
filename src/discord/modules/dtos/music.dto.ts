import { StringOption } from 'necord';

export class MusicDto {
  @StringOption({
    name: 'música',
    description: 'Música a tocar',
    required: true,
  })
  song: string;
  @StringOption({
    name: 'próxima',
    description: 'Adicionar ao início da fila?',
    required: false,
  })
  next: boolean;
}
