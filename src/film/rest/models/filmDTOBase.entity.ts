/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ArrayUnique, IsOptional, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FilmArt } from '../../entity/film.entity';

/**
 * DTO-Basis für Filme.
 */
export class FilmDTOBase {
    @ApiProperty({ example: 'Good Doctor', type: String })
    readonly name!: string;

    @ApiProperty({ example: 'de-DE', type: String })
    readonly sprache: string | undefined;

    @MaxLength(10)
    @ApiProperty({ example: 'ACTION', type: String })
    readonly genre: FilmArt | undefined;

    @Min(0)
    @Max(10)
    @ApiProperty({ example: 3, type: Number })
    readonly rating: number | undefined;

    @ApiProperty({ example: '2003-01-11' })
    readonly erscheinungsjahr: Date | string | undefined;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ examples: ['Insel', 'Wilson', 'Chuck'] })
    readonly schlagwoerter: string[] | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
