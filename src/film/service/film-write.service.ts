/**
 * Das Modul besteht aus der Klasse {@linkcode FilmWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type CreateError,
    type FilmNotExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { Film } from '../entity/film.entity.js';
import { FilmReadService } from './film-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import RE2 from 're2';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Films mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Films. */
    id: number | undefined;
    /** Film-Objekt mit den aktualisierten Werten. */
    film: Film;
    /** Versionsnummer für die aktualisierenden Werte. */
    version: string;
}

/**
 * Die Klasse `FilmWriteService` implementiert den Anwendungskern für das
 * Schreiben von Bücher und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class FilmWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Film>;

    readonly #readService: FilmReadService;

    readonly #logger = getLogger(FilmWriteService.name);

    constructor(
        @InjectRepository(Film) repo: Repository<Film>,
        readService: FilmReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    }

    /**
     * Ein neuer Film soll angelegt werden.
     * @param film Der neu anzulegende Film
     * @returns Die ID des neu angelegten Films oder im Fehlerfall
     * [CreateError](../types/film_service_errors.CreateError.html)
     */
    async create(film: Film): Promise<CreateError | number> {
        this.#logger.debug('create: film=%o', film);
        const validateResult = await this.#validateCreate(film);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const filmDb = await this.#repo.save(film); // implizite Transaktion
        this.#logger.debug('create: filmDb=%o', filmDb);

        return filmDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandener Film soll aktualisiert werden.
     * @param film Der zu aktualisierende Film
     * @param id ID des zu aktualisierenden Films
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/film_service_errors.UpdateError.html)
     */
    // https://2ality.com/2015/01/es6-destructuring.html#simulating-named-parameters-in-javascript
    async update({
        id,
        film,
        version,
    }: UpdateParams): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%d, film=%o, version=%s',
            id,
            film,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'FilmNotExists', id };
        }

        const validateResult = await this.#validateUpdate(film, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Film)) {
            return validateResult;
        }

        const filmNeu = validateResult;
        const merged = this.#repo.merge(filmNeu, film);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    async #validateCreate(film: Film): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: film=%o', film);

        const { name } = film;
        const filme = await this.#readService.find({ name });
        if (filme.length > 0) {
            return { type: 'NameExists', name };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        film: Film,
        id: number,
        versionStr: string,
    ): Promise<Film | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: film=%o, version=%s',
            film,
            version,
        );

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !FilmWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(
        id: number,
        version: number,
    ): Promise<Film | FilmNotExists | VersionOutdated> {
        const filmDb = await this.#readService.findById({ id });
        if (filmDb === undefined) {
            const result: FilmNotExists = { type: 'FilmNotExists', id };
            this.#logger.debug('#checkIdAndVersion: FilmNotExists=%o', result);
            return result;
        }

        // nullish coalescing
        const versionDb = filmDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return filmDb;
    }
}
