import { StringOption } from 'necord';

export class PrefixDto {
  @StringOption({
    name: 'text',
    description: 'Prefixo escolhido',
    required: true,
  })
  prefix: string;
}
