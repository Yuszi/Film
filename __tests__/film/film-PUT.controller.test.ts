import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type FilmDTOBase } from '../../src/film/rest/filmDTOBase.entity.js';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaenderterFilm: FilmDTOBase = {
    name: 'The Godfather',
    sprache: 'de-DE',
    genre: 'ACTION',
    rating: 5,
    erscheinungsjahr: '2022-03-03',
    schlagwoerter: ['KOMOEDIE'],
};
const idVorhanden = '1010';

const geaenderterFilmIdNichtVorhanden: FilmDTOBase = {
    name: 'SPIDER MAN',
    sprache: 'en-EN',
    genre: 'ACTION',
    rating: 10,
    erscheinungsjahr: '2020-02-07',
    schlagwoerter: ['HERO'],
};
const idNichtVorhanden = '999999';

const geaenderterFilmInvalid: Record<string, unknown> = {
    name: 'Invalid Movie',
    sprache: 'en-EN',
    rating: -1,
    genre: 'UNSICHTBAR',
    erscheinungdatum: '12345-123-123',
};

const veralteterFilm: FilmDTOBase = {
    name: 'Castaway',
    sprache: 'en-EN',
    genre: 'DRAMA',
    rating: 1,
    erscheinungsjahr: '2022-02-04',
    schlagwoerter: ['JAVASCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /rest/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Vorhandenen Film aendern', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenen Film aendern', async () => {
        // given
        const url = `/rest/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilmIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toBe(
            `Es gibt keinen Film mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenen Film aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        const expectedMsg = [
            expect.stringMatching(/^genre /u),
            expect.stringMatching(/^rating /u),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilmInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Vorhandenen Film aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veralteterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandenen Film aendern, aber ohne Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandenen Film aendern, aber mit falschem Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
