/**
 * Das Modul besteht aus der Klasse {@linkcode MailService} für das
 * Verschicken von Emails.
 * @packageDocumentation
 */

import { mailConfig, mailDeactivated } from '../config/mail.js';
import { Injectable } from '@nestjs/common';
import { type SendMailOptions } from 'nodemailer';
import { cloud } from '../config/cloud.js';
import { getLogger } from '../logger/logger.js';

/** Typdefinition für das Senden einer Email. */
export interface SendMailParams {
    /** Subject für die Email. */
    subject: string;
    /** Body für die Email. */
    body: string;
}
@Injectable()
export class MailService {
    readonly #logger = getLogger(MailService.name);

    async sendmail({ subject, body }: SendMailParams) {
        if (mailDeactivated) {
            this.#logger.warn('#sendmail: Mail deaktiviert');
        }
        if (cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';

        const data: SendMailOptions = { from, to, subject, html: body };
        this.#logger.debug('#sendMail: data=%o', data);

        try {
            const nodemailer = await import('nodemailer');
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err) {
            this.#logger.warn('#sendmail: Fehler %o', err);
        }
    }
}
