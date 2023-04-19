/**
 * Das Modul besteht aus der Klasse {@linkcode FilmWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type FilmNotExists,
    type CreateError,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { type DeleteResult, Repository } from 'typeorm';
import { Abbildung } from '../entity/abbildung.entity.js';
import { Film } from '../entity/film.entity.js';
import { FilmReadService } from './film-read.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import RE2 from 're2';
import { Hauptdarsteller } from '../entity/Hauptdarsteller.entity.js';
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

    readonly #mailService: MailService;

    readonly #logger = getLogger(FilmWriteService.name);

    constructor(
        @InjectRepository(Film) repo: Repository<Film>,
        readService: FilmReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
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

        await this.#sendmail(filmDb);

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

    /**
     * Ein Film wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Films
     * @returns true, falls der Film vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const film = await this.#readService.findById({
            id,
            mitAbbildungen: true,
        });
        if (film === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            // Der Film zur gegebenen ID mit dem Hauptdarsteller und Abb. asynchron loeschen

            // TODO "cascade" funktioniert nicht beim Loeschen
            const hauptdarstellerId = film.hauptdarsteller?.id;
            if (hauptdarstellerId !== undefined) {
                await transactionalMgr.delete(Hauptdarsteller, hauptdarstellerId);
            }
            const abbildungen = film.abbildungen ?? [];
            for (const abbildung of abbildungen) {
                await transactionalMgr.delete(Abbildung, abbildung.id);
            }

            deleteResult = await transactionalMgr.delete(Film, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate(film: Film): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: film=%o', film);

        const { name } = film;
        const buecher = await this.#readService.find({ name: name }); // eslint-disable-line object-shorthand
        if (buecher.length > 0) {
            return { type: 'NameExists', name };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(film: Film) {
        const subject = `Neuer Film ${film.id}`;
        const hauptdarsteller = film.hauptdarsteller?.hauptdarsteller ?? 'N/A';
        const body = `Der Film mit dem Hauptdarsteller <strong>${hauptdarsteller}</strong> ist angelegt`;
        await this.#mailService.sendmail({ subject, body });
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
