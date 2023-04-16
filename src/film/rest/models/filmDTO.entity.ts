import { FilmDTOBase } from './filmDTOBase.entity';
import { SchauspielerDTO } from './schauspielerDTO.entity';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

/**
 * Das Modul besteht aus der DTO-Klasse für Kapselung der Filmdaten für Datenübertragung zwischen der API und dem Client.
 * @packageDocumentation
 */

/**
 * DTO für Filme.
 */
export class FilmDTO extends FilmDTOBase {
    @ValidateNested()
    @Type(() => SchauspielerDTO)
    readonly hauptdarsteller!: SchauspielerDTO;
}
