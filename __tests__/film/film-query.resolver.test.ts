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
const idVorhanden = '1010';

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
                        genre
                        hauptdarsteller {
                            vorname
                            nachname
                            rolle
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
        const id = '1111';
        const body: GraphQLRequest = {
            query: `
                {
                    film(id: "${id}") {
                        name
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
});
