"use strict";
// 'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nconf_1 = __importDefault(require("nconf"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const winston_1 = __importDefault(require("winston"));
const prestart_1 = __importDefault(require("../../prestart"));
const database_1 = __importDefault(require("../../database"));
const user = require("../index");
nconf_1.default.argv().env({
    separator: '__',
});
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
// Alternate configuration file support
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const varOne = nconf_1.default.any(['config', 'CONFIG']) || 'config.json';
const configFile = path_1.default.resolve(__dirname, '../../../', varOne);
prestart_1.default.loadConfig(configFile);
prestart_1.default.setupWinston();
process.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg && msg.uid) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield database_1.default.init();
        const targetUid = msg.uid;
        const archivePath = path_1.default.join(__dirname, '../../../build/export', `${targetUid}_uploads.zip`);
        const rootDirectory = path_1.default.join(__dirname, '../../../public/uploads/');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 }, // Sets the compression level.
        });
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.on('warning', (err) => {
            switch (err.code) {
                case 'ENOENT':
                    winston_1.default.warn(`[user/export/uploads] File not found: ${err.path}`);
                    break;
                default:
                    winston_1.default.warn(`[user/export/uploads] Unexpected warning: ${err.message}`);
                    break;
            }
        });
        archive.on('error', (err) => {
            const trimPath = function (path) {
                return path.replace(rootDirectory, '');
            };
            switch (err.code) {
                case 'EACCES':
                    winston_1.default.error(`[user/export/uploads] File inaccessible: ${trimPath(err.path)}`);
                    break;
                default:
                    winston_1.default.error(`[user/export/uploads] Unable to construct archive: ${err.message}`);
                    break;
            }
        });
        const output = fs_1.default.createWriteStream(archivePath);
        output.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.close();
            process.exit(0);
        }));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.pipe(output);
        winston_1.default.verbose(`[user/export/uploads] Collating uploads for uid ${targetUid}`);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield user.collateUploads(targetUid, archive);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uploadedPicture = yield user.getUserField(targetUid, 'uploadedpicture');
        if (uploadedPicture) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const filePath = uploadedPicture.replace(nconf_1.default.get('upload_url'), '');
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            archive.file(path_1.default.join(nconf_1.default.get('upload_path'), filePath), {
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                name: path_1.default.basename(filePath),
            });
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        archive.finalize();
    }
}));
