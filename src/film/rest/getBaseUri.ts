import { FilmReadService } from '../service/film-read.service.js';
import { type Request } from 'express';
import { cloud } from '../../config/cloud.js';
import { nodeConfig } from '../../config/node.js';

/**
 * Das Modul besteht aus dem Helper für Ermittlung von Basis-Uri.
 * @packageDocumentation
 */

const port = cloud === undefined ? `:${nodeConfig.port}` : '';

export const getBaseUri = (req: Request) => {
    const { protocol, hostname, url } = req;

    let basePath = url.includes('?') ? url.slice(0, url.lastIndexOf('?')) : url;

    const indexLastSlash = basePath.lastIndexOf('/');
    if (indexLastSlash > 0) {
        const idStr = basePath.slice(indexLastSlash + 1);
        if (FilmReadService.ID_PATTERN.test(idStr)) {
            basePath = basePath.slice(0, indexLastSlash);
        }
    }

    return `${protocol}://${hostname}/${port}/${basePath}`;
};
