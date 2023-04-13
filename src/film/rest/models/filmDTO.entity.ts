import { FilmDTOBase } from './filmDTOBase.entity';
import { SchauspielerDTO } from './schauspielerDTO.entity';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

/**
 * DTO für Filme.
 */
export class FilmDTO extends FilmDTOBase {
    @ValidateNested()
    @Type(() => SchauspielerDTO)
    readonly hauptdarsteller!: SchauspielerDTO;
}
