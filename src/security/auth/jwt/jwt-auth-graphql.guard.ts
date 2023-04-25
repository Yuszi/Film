import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type BasicUser } from './jwt.strategy.js';
import { GqlExecutionContext } from '@nestjs/graphql';
import { type Request } from 'express';
import { getLogger } from '../../../logger/logger.js';

/**
 * Das Guard stellt sicher, dass bei einem Request an der GraphQL-Schnittstelle
 * ein gültiger JWT verwendet wird, d.h. dass der/die Endbenutzer/in sich in der
 * Vergangenheit eingeloggt und einen Token erhalten hat, der jetzt im Header
 * "Authorization" mitgeschickt wird. Der Token wird mit der konfigurierten
 * Strategie verifiziert und das zugehoerige User-Objekt wird im Request-Objekt
 * gespeichert, damit in `RolesGuard` die Rollen bzw. Zugriffsrechte überprüft
 * werden, wenn in einem Controller @RolesAllowed() verwendet wird.
 *
 * https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
 * https://docs.nestjs.com/security/authentication#graphql
 */
@Injectable()
export class JwtAuthGraphQlGuard extends AuthGuard('jwt') {
    readonly #logger = getLogger(JwtAuthGraphQlGuard.name);

    /**
     * Ermittlung des Request-Objekts bei GraphQL.
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird. Siehe https://docs.nestjs.com/security/authentication#graphql
     *
     * `override` kann nicht verwendet werden. Details siehe in der funktionalen
     * Implementierung in https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
     */
    getRequest(context: ExecutionContext): Request {
        this.#logger.debug('getRequest');
        return GqlExecutionContext.create(context).getContext().req as Request;
    }

    /**
     * Die geerbte Methode wird überschrieben, damit das User-Objekt aus
     * `JwtStrategy.validate()` im Request-Objekt gepuffert wird.
     * @param _err wird nicht benutzt
     * @param user das User-Objekt, das durch `JwtStrategy.validate()` ermittelt wurde.
     * @param _info wird nicht benutzt
     * @param context der Ausführungskontext, mit dem das Request-Objekt
     * ermittelt wird
     */
    // eslint-disable-next-line max-params
    override handleRequest(
        _err: unknown,
        user: any, // type-coverage:ignore-line
        _info: unknown,
        context: ExecutionContext,
    ) {
        this.#logger.debug('handleRequest: user=%o', user); // type-coverage:ignore-line
        const request = this.getRequest(context);
        request.user = user as BasicUser;
        // type-coverage:ignore-next-line
        return user; // eslint-disable-line @typescript-eslint/no-unsafe-return
    }
}
