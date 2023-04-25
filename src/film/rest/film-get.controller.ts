/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file */
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
<<<<<<< HEAD:src/film/rest/controllers/film-get.controller.ts
import { type Film, type FilmArt } from '../../entity/film.entity.js';
=======
import { type Film, type FilmArt } from '../entity/film.entity';
>>>>>>> bc3d687660673fd73e0f50b367f91afab9a708ed:src/film/rest/film-get.controller.ts
import {
    FilmReadService,
    type Suchkriterien,
} from '../service/film-read.service.js';
import { Request, Response } from 'express';
<<<<<<< HEAD:src/film/rest/controllers/film-get.controller.ts
import { Hauptdarsteller } from '../../entity/hauptdarsteller.entity.js';
import { ResponseTimeInterceptor } from '../../../logger/response-time.interceptor.js';
import { getBaseUri } from '../getBaseUri.js';
import { getLogger } from '../../../logger/logger.js';
import { paths } from '../../../config/paths.js';
=======
import { Hauptdarsteller } from '../entity/hauptdarsteller.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getBaseUri } from './getBaseUri';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths';
>>>>>>> bc3d687660673fd73e0f50b367f91afab9a708ed:src/film/rest/film-get.controller.ts

/** href-Link für HATEOAS */
export interface Link {
    href: string;
}

/** Links für HATEOAS */
export interface Links {
    self: Link;
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}
/** Typedefinition für ein Hauptdarsteller-Objekt ohne Rückwärtsverweis zum Film. */
export type HauptdarstellerModel = Omit<Hauptdarsteller, 'film' | 'id'>;

/** Film-Objekt mit HATEOAS-Links. */
export type FilmModel = Omit<
    Film,
    'aktualisiert' | 'erzeugt' | 'hauptdarsteller' | 'id' | 'version'
> & {
    hauptdarsteller: HauptdarstellerModel;
    links: Links;
};

/** Film-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface FilmeModel {
    embedded: {
        filme: FilmModel[];
    };
}
//TODO Json statt "hauptdarstellerVorname/Nachname/Alter"
/**
 * Klasse für `FilmGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren.
 */
export class FilmQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly name: string;

    @ApiProperty({ required: false })
    declare readonly sprache: string;

    @ApiProperty({ required: false })
    declare readonly genre: FilmArt;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly erscheinungsjahr: Date;

    @ApiProperty({ required: false })
    declare readonly hauptdarstellerVorname: string;

    @ApiProperty({ required: false })
    declare readonly hauptdarstellerNachname: string;

    @ApiProperty({ required: false })
    declare readonly hauptdarstellerAlter: number;
}

/**
 * Die Controller-Klasse für Suchen nach den Filmen.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film API')
export class FilmGetController {
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmGetController.name);

    constructor(service: FilmReadService) {
        this.#service = service;
    }

    /**
     * Asynchrones Suchen nach einem Film anhand der ID.
     * @param id Pfad-Parameter für die ID.
     * @param req Request-Objekt von Express.
     * @param version Versionsnummer im Request-Header bei 'If-None-Match'.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    //eslint-disable-next-line max-params
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Film-ID', tags: ['Suchen'] })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 00000000-0000-0000-0000-000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Film wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Film zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Film wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<FilmModel | undefined>> {
        this.#logger.debug('findById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let film: Film | undefined;
        try {
            film = await this.#service.findById({ id });
        } catch (err) {
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (film === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById: film=%o', film);

        const versionDb = film.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        const filmModel = this.#toModel(film, req);
        this.#logger.debug('findById: filmModel=%o', filmModel);
        return res.json(filmModel);
    }

    /**
     * Asynchrones Suchen nach einem Film mit Query-Parametern.
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien' })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Filmen' })
    async find(
        @Query() query: FilmQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<FilmeModel | undefined>> {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const filme = await this.#service.find(query);
        this.#logger.debug('find: %o', filme);

        if (filme.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        const filmeModel = filme.map((film) => this.#toModel(film, req, false));
        this.#logger.debug('find: filmeModel=%o', filmeModel);

        const result: FilmeModel = { embedded: { filme: filmeModel } };
        return res.json(result).send();
    }

    #toModel(film: Film, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const {
            id,
            name,
            sprache,
            genre,
            rating,
            erscheinungsjahr,
            schlagwoerter,
            hauptdarsteller,
        } = film;

        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: film=%o, links=%o', film, links);
        const hauptdarstellerModel: HauptdarstellerModel = {
            rolle: hauptdarsteller?.rolle ?? 'N/A',
            vorname: hauptdarsteller?.vorname ?? 'N/A',
            nachname: hauptdarsteller?.nachname ?? 'N/A',
            alter: hauptdarsteller?.alter,
        };

        const filmModel: FilmModel = {
            name,
            sprache,
            genre,
            rating,
            erscheinungsjahr,
            schlagwoerter,
            hauptdarsteller: hauptdarstellerModel,
            links,
        };

        this.#logger.debug('#toModel: filmModel=%o', filmModel);
        return filmModel;
    }
}
/*eslint-enable max-classes-per-file */
