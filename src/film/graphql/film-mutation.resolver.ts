// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { BadUserInputError } from './errors.js';
import { Film } from '../entity/film.entity.js';
import { FilmDTO } from '../rest/filmDTO.entity.js';
import { FilmWriteService } from '../service/film-write.service.js';
import { type Hauptdarsteller } from '../entity/hauptdarsteller.entity.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { getLogger } from '../../logger/logger.js';

export class FilmUpdateDTO extends FilmDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class FilmMutationResolver {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmMutationResolver.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async create(@Args('input') filmDTO: FilmDTO) {
        this.#logger.debug('create: filmDTO=%o', filmDTO);

        const film = this.#filmDtoToFilm(filmDTO);
        const result = await this.#service.create(film);
        this.#logger.debug('createFilm: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new BadUserInputError(
                this.#errorMsgCreateFilm(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @RolesAllowed('admin', 'mitarbeiter')
    async update(@Args('input') filmDTO: FilmUpdateDTO) {
        this.#logger.debug('update: film=%o', filmDTO);

        const film = this.#filmUpdateDtoToFilm(filmDTO);
        const versionStr = `"${filmDTO.version.toString()}"`;

        const result = await this.#service.update({
            id: Number.parseInt(filmDTO.id, 10),
            film,
            version: versionStr,
        });
        if (typeof result === 'object') {
            throw new BadUserInputError(this.#errorMsgUpdateFilm(result));
        }
        this.#logger.debug('updateFilm: result=%d', result);
        return result;
    }

    #filmDtoToFilm(filmDTO: FilmDTO): Film {
        const hauptdarstellerDTO = filmDTO.hauptdarsteller;
        const hauptdarsteller: Hauptdarsteller = {
            id: undefined,
            rolle: hauptdarstellerDTO.rolle,
            vorname: hauptdarstellerDTO.vorname,
            nachname: hauptdarstellerDTO.nachname,
            alter: hauptdarstellerDTO.alter,
            film: undefined,
        };

        const film = {
            id: undefined,
            version: undefined,
            name: filmDTO.name,
            sprache: filmDTO.sprache,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            schlagwoerter: filmDTO.schlagwoerter,
            hauptdarsteller, //TODO
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        // Rueckwaertsverweis
        film.hauptdarsteller.film = film;
        return film;
    }

    #filmUpdateDtoToFilm(filmDTO: FilmUpdateDTO): Film {
        return {
            id: undefined,
            version: undefined,
            name: filmDTO.name,
            sprache: filmDTO.sprache,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            schlagwoerter: filmDTO.schlagwoerter,
            hauptdarsteller: undefined, //TODO
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #errorMsgCreateFilm(err: CreateError) {
        switch (err.type) {
            case 'NameExists': {
                return `Der Name ${err.type} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdateFilm(err: UpdateError) {
        switch (err.type) {
            case 'FilmNotExists': {
                return `Es gibt keinen Film mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
