import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as url from 'url';
import * as util from 'util';
import { workspace, ExtensionContext, window, ProgressLocation } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
    // Create the storage dir
    if (!fs.existsSync(context.globalStorageUri.path)) {
        fs.mkdirSync((context.globalStorageUri.path));
    }

    // Start the language server
    if (workspace.getConfiguration("quickbms").enableLanguageServer) {
        await runLanguageServer(context);
    }
}

async function runLanguageServer(context: ExtensionContext) {
    // Warn if on mac, since we don't support it yet
    if (process.platform == "darwin") {
        window.showInformationMessage("QuickBMS language server does not yet support Mac because of Rust cross-compiling difficulties.\nSee: https://github.com/ExcaliburZero/quickbms-lsp/issues/9");

        return;
    }

    const serverVersion = workspace.getConfiguration("quickbms").languageServerVersion;
    const serverExecutable = await getServerExecutable(context, serverVersion);

    let serverOptions: ServerOptions = {
        run: { command: serverExecutable, args: [], options: null },
        debug: { command: serverExecutable, args: [], options: null }
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'quickbms' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'quickbmsServer',
        'QuickBMS Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

async function getServerExecutable(context: ExtensionContext, serverVersion: string): Promise<string> {
    const executableName = `quickbms-lsp-${serverVersion}-${getPlatformExecSuffix(process.platform)}`;
    const executableUrl = `https://github.com/ExcaliburZero/quickbms-lsp/releases/download/${serverVersion}/quickbms-lsp-` + getPlatformExecSuffix(process.platform);

    const executablePath = path.join(context.globalStorageUri.path, executableName);

    await downloadFile(`Downloading QuickBMS language server: ${executableName}`, executableUrl, executablePath);

    return executablePath;
}

/** downloadFile may get called twice on the same src and destination:
 * When this happens, we should only download the file once but return two
 * promises that wait on the same download. This map keeps track of which
 * files are currently being downloaded and we short circuit any calls to
 * downloadFile which have a hit in this map by returning the promise stored
 * here.
 * Note that we have to use a double nested map since array/pointer/object
 * equality is by reference, not value in Map. And we are using a tuple of
 * [src, dest] as the key.
 */
const inFlightDownloads = new Map<string, Map<string, Thenable<void>>>();

const userAgentHeader = { 'User-Agent': 'vscode-quickbms' };

async function downloadFile(titleMsg: string, src: string, dest: string): Promise<void> {
    // This function and a few other related functions were based off of code from the
    // vscode-haskell extension (MIT License)
    // https://github.com/haskell/vscode-haskell
    // https://github.com/haskell/vscode-haskell/blob/b14b3735d4582de485342cc8f5c51b2892caea5b/src/utils.ts#L75-L188

    // Check to see if we're already in the process of downloading the same thing
    const inFlightDownload = inFlightDownloads.get(src)?.get(dest);
    if (inFlightDownload) {
        return inFlightDownload;
    }

    // If it already is downloaded just use that
    if (fs.existsSync(dest)) {
        return;
    }

    // Download it to a .tmp location first, then rename it!
    // This way if the download fails halfway through or something then we know
    // to delete it and try again
    const downloadDest = dest + '.download';
    if (fs.existsSync(downloadDest)) {
        fs.unlinkSync(downloadDest);
    }

    const downloadTask = window.withProgress(
        {
            location: ProgressLocation.Notification,
            title: titleMsg,
            cancellable: false,
        },
        async (progress) => {
            const p = new Promise<void>((resolve, reject) => {
                const srcUrl = url.parse(src);
                const opts: https.RequestOptions = {
                    host: srcUrl.host,
                    path: srcUrl.path,
                    protocol: srcUrl.protocol,
                    port: srcUrl.port,
                    headers: userAgentHeader,
                };
                getWithRedirects(opts, (res) => {
                    const totalSize = parseInt(res.headers['content-length'] || '1', 10);
                    const fileStream = fs.createWriteStream(downloadDest, { mode: 0o744 });
                    let curSize = 0;

                    res.pipe(fileStream);

                    function toMB(bytes: number) {
                        return bytes / (1024 * 1024);
                    }

                    res.on('data', (chunk: Buffer) => {
                        curSize += chunk.byteLength;
                        const msg = `${toMB(curSize).toFixed(1)}MB / ${toMB(totalSize).toFixed(1)}MB ${downloadDest}`;
                        progress.report({ message: msg, increment: (chunk.length / totalSize) * 100 });
                    });
                    res.on('error', reject);
                    fileStream.on('close', resolve);
                }).on('error', reject);
            });
            try {
                await p;
                // Finally rename it to the actual dest
                fs.renameSync(downloadDest, dest);
            } finally {
                // And remember to remove it from the list of current downloads
                inFlightDownloads.get(src)?.delete(dest);
            }
        }
    );

    try {
        if (inFlightDownloads.has(src)) {
            inFlightDownloads.get(src)?.set(dest, downloadTask);
        } else {
            inFlightDownloads.set(src, new Map([[dest, downloadTask]]));
        }
        return await downloadTask;
    } catch (e) {
        await util.promisify(fs.unlink)(downloadDest).catch(ignoreFileNotExists);
        throw new Error(`Failed to download ${src}:\n${e.message}`);
    }
}

function getWithRedirects(opts: https.RequestOptions, f: (res: http.IncomingMessage) => void): http.ClientRequest {
    return https.get(opts, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            if (!res.headers.location) {
                console.error('301/302 without a location header');
                return;
            }
            https.get(res.headers.location, f);
        } else {
            f(res);
        }
    });
}

async function ignoreFileNotExists(err: NodeJS.ErrnoException): Promise<void> {
    if (err.code === 'ENOENT') {
        return;
    }
    throw err;
}

function getPlatformExecSuffix(x: string): string | null {
    switch (x) {
        case 'darwin':
            return 'macOS';
        case 'linux':
            return 'Linux';
        case 'win32':
            return 'Windows.exe';
        default:
            return null;
    }
}