import { type User, UserService } from './user.service.js';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getLogger } from '../../../logger/logger.js';
import { jwtConfig } from '../../../config/jwt.js';
import { v4 as uuidv4 } from 'uuid';
import { verify } from 'argon2';

export interface ValidateParams {
    username: string | undefined;
    password: string | undefined;
}

export interface LoginResult {
    token: string;
    expiresIn: number | string | undefined;
    roles?: readonly string[];
}

@Injectable()
export class AuthService {
    readonly #userService: UserService;

    readonly #jwtService: JwtService;

    readonly #logger = getLogger(AuthService.name);

    constructor(userService: UserService, jwtService: JwtService) {
        this.#userService = userService;
        this.#jwtService = jwtService;
    }

    async validate({ username, password: pass }: ValidateParams) {
        this.#logger.debug('validate: username=%s', username);
        if (username === undefined || pass === undefined) {
            this.#logger.debug('validate: Username oder Passwort fehlen.');
            return;
        }
        const user = await this.#userService.findOne(username);
        this.#logger.debug('validate: user.id=%s', user?.userId);
        if (user === undefined) {
            this.#logger.debug(
                'validate: Kein User zu "%s" gefunden.',
                username,
            );
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

    /*eslint-disable-next-line @typescript-eslint/require-await */
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
