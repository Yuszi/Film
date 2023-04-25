/* eslint-disable @typescript-eslint/require-await*/
import { Injectable } from '@nestjs/common';
import { type Role } from './role.js';
import { getLogger } from '../../../logger/logger.js';
import { users } from '../../../config/dev/users.js';

export interface User {
    userId: number;
    username: string;
    password: string;
    email: string;
    roles: Role[];
}

@Injectable()
export class UserService {
    readonly #users = users;

    readonly #logger = getLogger(UserService.name);

    constructor() {
        this.#logger.info('users=%o', users);
    }

    async findOne(username: string) {
        return this.#users.find((user) => user.username === username);
    }

    async findById(id: number | undefined) {
        return this.#users.find((user) => user.userId === id);
    }
}
/* eslint-enable @typescript-eslint/require-await */
