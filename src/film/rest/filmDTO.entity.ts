import { FilmDTOBase } from './filmDTOBase.entity';
import { HauptdarstellerDTO } from './hauptdarstellerDTO.entity';
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
    @Type(() => HauptdarstellerDTO)
    readonly hauptdarsteller!: HauptdarstellerDTO;
}
