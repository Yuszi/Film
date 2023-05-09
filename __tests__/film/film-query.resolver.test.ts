/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type FilmDTO } from '../../src/film/graphql/film-query.resolver.js';
import { HttpStatus } from '@nestjs/common';

/* eslint-disable jest/no-export */
export type GraphQLQuery = Pick<GraphQLRequest, 'query'>;
export type GraphQLResponseBody = Pick<GraphQLResponse, 'data' | 'errors'>;
/* eslint-enable jest/no-export */

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';

const nameVorhanden = 'Alpha';

const teilNameVorhanden = 'a';

const teilNameNichtVorhanden = 'abc';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Film zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${idVorhanden}") {
                        version
                        name
                        art
                        name {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { film } = data.data!;
        const result: FilmDTO = film;

        expect(result.name).toMatch(/^\w/u);
        expect(result.version).toBeGreaterThan(-1);
        expect(result.id).toBeUndefined();
    });

    test('Film zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${id}") {
                        name {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data?.film).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(`Es wurde kein Film mit der ID ${id} gefunden.`);
        expect(path).toBeDefined();
        expect(path?.[0]).toBe('film');
        expect(extensions).toBeDefined();
        expect(extensions?.code).toBe('BAD_USER_INPUT');
    });

    test('Film zu vorhandenem Name', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(name: "${nameVorhanden}") {
                        art
                        name {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;

        expect(filmeArray).toHaveLength(1);

        const [film] = filmeArray;

        expect(film?.name).toBe(nameVorhanden);
    });

    test('Film zu vorhandenem Teil-Name', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(name: "${teilNameVorhanden}") {
                        art
                        name {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { filme } = data.data!;

        expect(filme).not.toHaveLength(0);

        const filmeArray: FilmDTO[] = filme;
        filmeArray
            .map((film) => film.name)
            .forEach((name) =>
                expect(name.toLowerCase()).toEqual(
                    expect.stringContaining(teilNameVorhanden),
                ),
            );
    });

    test('Film zu nicht vorhandenem Name', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    filme(name: "${teilNameNichtVorhanden}") {
                        art
                        name {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.filme).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe('Es wurden keine Filme gefunden.');
        expect(path).toBeDefined();
        expect(path?.[0]).toBe('filme');
        expect(extensions).toBeDefined();
        expect(extensions?.code).toBe('BAD_USER_INPUT');
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
});
