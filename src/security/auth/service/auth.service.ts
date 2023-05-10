/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import { type User, UserService } from './user.service.js';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getLogger } from '../../../logger/logger.js';
import { jwtConfig } from '../../../config/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import { verify } from 'argon2';

/** Typdefinition für die Validierung der Authentifizierungsdaten. */
export interface ValidateParams {
    /** Benutzername. */
    username: string | undefined;
    /** Eingegebenes Passwort. */
    pass: string | undefined;
}

export interface LoginResult {
    token: string;
    expiresIn: number | string | undefined;
    roles?: readonly string[];
}

/**
 * Die Klasse `AuthService` implementiert die Funktionen für die
 * Authentifizierung wie z.B. Einloggen und Validierung von JSON Web Tokens.
 * Eine Injectable-Klasse ist ein _Singleton_, **kein** Request-Singleton.
 */
@Injectable()
export class AuthService {
    readonly #userService: UserService;

    readonly #jwtService: JwtService;

    readonly #logger = getLogger(AuthService.name);

    constructor(userService: UserService, jwtService: JwtService) {
        this.#userService = userService;
        this.#jwtService = jwtService;
    }

    /**
     * Aufruf durch Passport beim Einloggen, wobei Benutzername und Passwort
     * übergeben werden.
     *
     * @param username Benutzername.
     * @param pass Passwort.
     * @return Das User-Objekt ohne Passwort oder undefined.
     */
    async validate({ username, pass }: ValidateParams) {
        this.#logger.debug('validate: username=%s', username);
        if (username === undefined || pass === undefined) {
            this.#logger.debug('validate: username oder password fehlen.');
            return;
        }
        const user = await this.#userService.findOne(username);
        this.#logger.debug('validate: user.id=%d', user?.userId);
        if (user === undefined) {
            this.#logger.debug('validate: Kein User zu %s gefunden.', username);
            return;
        }

        const userPassword = user.password;
        this.#logger.debug('validate: userPassword=*****, password=*****');
        const isPasswordValid = await this.#checkPassword(userPassword, pass);
        if (!isPasswordValid) {
            this.#logger.debug('validate: Falsches Passwort.');
            return;
        }

        const { password, ...result } = user;
        this.#logger.debug('validate: result=%o', result);
        return result;
    }

    /**
     * Das eigentliche Einloggen eines validierten Users, bei dem das Passwort
     * in `AuthService.validate` überprüft wurde.
     * @param user Das validierte User-Objekt vom Typ "any", damit es von
     * einem Controller über die Property "user" des Request-Objekts benutzt
     * werden kann.
     * @return Objekt mit einem JWT als künftiger "Access Token", dem
     * Zeitstempel für das Ablaufdatum (`expiresIn`) und den Rollen als Array
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    async login(user: unknown) {
        const userObj = user as User;

        const payload = {
            username: userObj.username,
            sub: userObj.userId,
            type: 'access',
            jti: uuidv4(),
        };

        const { signOptions } = jwtConfig;
        const token = this.#jwtService.sign(payload, signOptions);

        const result: LoginResult = {
            token,
            expiresIn: signOptions.expiresIn,
            roles: userObj.roles,
        };

        this.#logger.debug('login: result=%o', result);
        return result;
    }

    async #checkPassword(userPassword: string | undefined, password: string) {
        if (userPassword === undefined) {
            this.#logger.debug('#checkPassword: Passwort fehlt');
            return false;
        }
        const result = await verify(userPassword, password);
        this.#logger.debug('#checkPassword: %s', result);
        return result;
    }
}
