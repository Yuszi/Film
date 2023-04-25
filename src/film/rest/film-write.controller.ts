/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Headers,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { Request, Response } from 'express';
<<<<<<< HEAD:src/film/rest/controllers/film-write.controller.ts
import { type Film } from '../../entity/film.entity.js';
import { FilmDTO } from '../models/filmDTO.entity.js';
import { FilmWriteService } from '../../service/film-write.service.js';
import { Hauptdarsteller } from '../../entity/hauptdarsteller.entity.js';
import { JwtAuthGuard } from '../../../security/auth/jwt/jwt-auth.guard.js';
import { ResponseTimeInterceptor } from '../../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGuard } from '../../../security/auth/roles/roles.guard.js';
import { getBaseUri } from '../getBaseUri.js';
import { getLogger } from '../../../logger/logger.js';
import { paths } from '../../../config/paths.js';
=======
import { type Film } from './../entity/film.entity.js';
import { FilmDTO } from './filmDTO.entity';
import { FilmWriteService } from '../service/film-write.service.js';
import { Hauptdarsteller } from '../entity/hauptdarsteller.entity.js';
import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGuard } from '../../security/auth/roles/roles.guard.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';
>>>>>>> bc3d687660673fd73e0f50b367f91afab9a708ed:src/film/rest/film-write.controller.ts

/**
 * Die Controller-Klasse für Neuanlegen und Aktualisieren der Filme.
 */
@Controller(paths.rest)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film API')
@ApiBearerAuth()
export class FilmWriteController {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmWriteController.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    /**
     * Asynchrones Anlegen eines neuen Films.
     * @param filmDTO JSON-Daten für einen Film im Request-Body.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @RolesAllowed('admin', 'mitarbeiter')
    @ApiOperation({ summary: 'Ein neuer Film anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Filmdaten' })
    async create(
        @Body() filmDTO: FilmDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('create: filmDTO=%o', filmDTO);

        const film = this.#filmDtoToFilm(filmDTO);
        const result = await this.#service.create(film);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            return this.#handleCreateError(result as CreateError, res);
        }

        const location = `${getBaseUri(req)}/${result as number}`;
        this.#logger.debug('create: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Asynchrones Aktualisieren des vorhandenen Films.
     * @param filmDTO Filmdaten im Body des Request-Objekts.
     * @param id Pfad-Parameter für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @RolesAllowed('admin', 'mitarbeiter')
    @ApiOperation({
        summary: 'Ein vorhandener Film aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Filmdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_FAILED,
        description: 'Header "If-Match" fehlt',
    })
    async update(
        @Body() filmDTO: FilmDTO,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'update: id=%s, filmDTO=%o, version=%s',
            id,
            filmDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('#handleUpdateError: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }

        const film = this.#filmDtoOhneRefToFilm(filmDTO);
        const result = await this.#service.update({ id, film, version });
        if (typeof result === 'object') {
            return this.#handleUpdateError(result, res);
        }

        this.#logger.debug('update: version=%d', result);
        return res.set('ETag', `"${result}"`).sendStatus(HttpStatus.NO_CONTENT);
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
            hauptdarsteller,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        film.hauptdarsteller.film = film;
        return film;
    }

    #filmDtoOhneRefToFilm(filmDTO: FilmDTO): Film {
        return {
            id: undefined,
            version: undefined,
            name: filmDTO.name,
            sprache: filmDTO.sprache,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            schlagwoerter: filmDTO.schlagwoerter,
            hauptdarsteller: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #handleCreateError(err: CreateError, res: Response) {
        switch (err.type) {
            case 'NameExists': {
                return this.#handleNameExists(err.type, res);
            }

            default: {
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    #handleNameExists(
        name: string | null | undefined,
        res: Response,
    ): Response {
        const msg = `Der Filmname "${name}" existiert bereits.`;
        this.#logger.debug('#handleNameExists: msg=%s', msg);
        return res
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    #handleUpdateError(err: UpdateError, res: Response): Response {
        switch (err.type) {
            case 'FilmNotExists': {
                const { id } = err;
                const msg = `Es gibt keinen Film mit der ID "${id}".`;
                this.#logger.warn('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.NOT_FOUND)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionInvalid': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
                this.#logger.warn('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionOutdated': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            default: {
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
