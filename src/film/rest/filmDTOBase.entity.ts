/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
    ArrayUnique,
    IsOptional,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FilmArt } from '../entity/film.entity.js';

/**
 * Das Modul besteht aus der DTO-Klasse für Kapselung der Filmdaten für Datenübertragung zwischen der API und dem Client.
 * @packageDocumentation
 */

/**
 * DTO-Basis für Filme.
 */
export class FilmDTOBase {
    @ApiProperty({ example: 'Good Doctor', type: String })
    readonly name!: string;

    @MaxLength(5)
    @Matches(/^([a-z]{2})-([A-Z]{2})/u)
    @ApiProperty({ example: 'de-DE', type: String })
    readonly sprache: string | undefined;

    @MaxLength(10)
    @Matches(/^ACTION$|^DRAMA$|^ROMANCE/u)
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
