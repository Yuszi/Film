/* eslint-disable eslint-comments/disable-enable-pair */

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type FilmeModel } from '../../src/film/rest/film-get.controller.js';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const nameVorhanden = 'Sp';
const nameNichtVorhanden = 'ae';
const schlagwortVorhanden = 'hero';
const schlagwortNichtVorhanden = 'suspect';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Filme', async () => {
        // given

        // when
        const response: AxiosResponse<FilmeModel> = await client.get('/');

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { filme } = data.embedded;

        filme
            .map((film) => film.links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'u'));
            });
    });

    test('Filme mit einem Teil-Name suchen', async () => {
        // given
        const params = { name: nameVorhanden };

        // when
        const response: AxiosResponse<FilmeModel> = await client.get('/', {
            params,
        });

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { filme } = data.embedded;

        // Jeder Film hat einen Namen mit dem Teilstring 'Sp'
        filme
            .map((film) => film.name)
            .forEach((name) =>
                expect(name.toLowerCase()).toEqual(
                    expect.stringContaining(nameVorhanden),
                ),
            );
    });

    test('Filme zu einem nicht vorhandenen Teil-Name suchen', async () => {
        // given
        const params = { name: nameNichtVorhanden };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    test('Mind. 1 Film mit vorhandenem Schlagwort', async () => {
        // given
        const params = { [schlagwortVorhanden]: 'true' };

        // when
        const response: AxiosResponse<FilmeModel> = await client.get('/', {
            params,
        });

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        // JSON-Array mit mind. 1 JSON-Objekt
        expect(data).toBeDefined();

        const { filme } = data.embedded;

        // Jedes Film hat im Array der Schlagwoerter z.B. "javascript"
        filme
            .map((film) => film.schlagwoerter)
            .forEach((schlagwoerter) =>
                expect(schlagwoerter).toEqual(
                    expect.arrayContaining([schlagwortVorhanden.toUpperCase()]),
                ),
            );
    });

    test('Keine Filme zu einem nicht vorhandenen Schlagwort', async () => {
        // given
        const params = { [schlagwortNichtVorhanden]: 'true' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    test('Keine Filme zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
