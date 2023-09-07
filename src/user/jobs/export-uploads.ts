// 'use strict';

import nconf from 'nconf';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import winston from 'winston';
import prestart from '../../prestart';
import db from '../../database';
import user = require('../index');

nconf.argv().env({
    separator: '__',
});

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Alternate configuration file support
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const varOne: string = (nconf.any(['config', 'CONFIG']) as string) || 'config.json';
const configFile = path.resolve(__dirname, '../../../', varOne);
prestart.loadConfig(configFile);
prestart.setupWinston();

interface msg {
    uid: string;
}

process.on('message', async (msg: msg) => {
    if (msg && msg.uid) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.init();

        const targetUid = msg.uid;

        const archivePath = path.join(__dirname, '../../../build/export', `${targetUid}_uploads.zip`);
        const rootDirectory = path.join(__dirname, '../../../public/uploads/');

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const archive = archiver('zip', {
            zlib: { level: 9 }, // Sets the compression level.
        });

        interface err {
            code: string;
            path: string;
            message: string;
        }

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.on('warning', (err: err) => {
            switch (err.code) {
            case 'ENOENT':
                winston.warn(`[user/export/uploads] File not found: ${err.path}`);
                break;

            default:
                winston.warn(`[user/export/uploads] Unexpected warning: ${err.message}`);
                break;
            }
        });

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.on('error', (err: err) => {
            const trimPath = function (path: string) {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                return path.replace(rootDirectory, '');
            };
            switch (err.code) {
            case 'EACCES':
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                winston.error(`[user/export/uploads] File inaccessible: ${trimPath(err.path)}`);
                break;

            default:
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                winston.error(`[user/export/uploads] Unable to construct archive: ${err.message}`);
                break;
            }
        });

        const output = fs.createWriteStream(archivePath);
        output.on('close', async () => {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.close();
            process.exit(0);
        });

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.pipe(output);
        winston.verbose(`[user/export/uploads] Collating uploads for uid ${targetUid}`);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await user.collateUploads(targetUid, archive);

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uploadedPicture: string = await user.getUserField(targetUid, 'uploadedpicture') as string;
        if (uploadedPicture) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const filePath: string = uploadedPicture.replace(nconf.get('upload_url') as string, '');
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            archive.file(path.join(nconf.get('upload_path') as string, filePath), {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                name: path.basename(filePath),
            });
        }

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.finalize();
    }
});
