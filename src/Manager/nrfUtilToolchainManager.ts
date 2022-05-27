/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getAppFile, logger } from 'pc-nrfconnect-shared';

import { TaskEvent, Toolchain } from '../state';

const nrfutilToolchainManager = () => {
    const executable = getAppFile(
        path.join(
            'resources',
            'nrfutil-toolchain-manager',
            process.platform,
            'nrfutil-toolchain-manager.exe'
        )
    );

    if (executable == null || !existsSync(executable)) {
        const message = `No executable '${executable}' found.`;

        logger.error(message);
        throw new Error(message);
    }

    return executable;
};

export const getNrfUtilConfig = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'config'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);

    return data as Config;
};

export const listSdks = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as SDK[];
};

export const searchSdks = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as SearchResultSDK[];
};

export const logNrfUtilTMVersion = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', '--version'], {
        encoding: 'utf8',
    });

    const version = JSON.parse(tcm.stdout).data as VersionInformation;

    logger.info(
        `${version.name} ${version.version} (${version.commit_hash} ${version.commit_date})`
    );
};

export const handleChunk = (onUpdate: (update: TaskEvent) => void) => {
    let buffer = '';
    return (chunk: Buffer) => {
        buffer += chunk.toString('utf8');

        while (buffer.includes('\n')) {
            const message = buffer.split('\n')[0];
            buffer = buffer.substring(message.length + 1);
            onUpdate(JSON.parse(message));
        }
    };
};

export const installSdk = (
    version: string,
    onUpdate: (update: TaskEvent) => void
) =>
    new Promise(resolve => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'install',
            version,
        ]);

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', resolve);
    });

export const sdkPath = (version: string) =>
    path.resolve(getNrfUtilConfig().install_dir, version);

export const westInit = (version: string) =>
    new Promise(resolve => {
        mkdirSync(sdkPath(version), {
            recursive: true,
        });

        const tcm = spawn(nrfutilToolchainManager(), [
            'launch',
            '--chdir',
            sdkPath(version),
            '--',
            'west',
            'init',
            '-m',
            'https://github.com/nrfconnect/sdk-nrf',
            '--mr',
            version,
        ]);

        tcm.on('close', resolve);
    });

export const westUpdate = (
    version: string,
    onUpdate: (update: string) => void,
    onError: (error: string) => void
) =>
    new Promise(resolve => {
        const tcm = spawn(nrfutilToolchainManager(), [
            'launch',
            '--chdir',
            sdkPath(version),
            '--',
            'west',
            'update',
        ]);

        tcm.stdout.on('data', onUpdate);
        tcm.stdout.on('error', onError);
        tcm.stderr.on('data', onError);
        tcm.on('close', resolve);
    });

interface SDK {
    path: string;
    toolchain: {
        path: string;
    };
    version: string;
}

interface SearchResultSDK {
    toolchains: Toolchain[];
    version: string;
}

interface VersionInformation {
    build_timestamp: string;
    commit_date: string;
    commit_hash: string;
    dependencies: null;
    host: string;
    name: string;
    version: string;
}

interface Config {
    current_sdk_install: null;
    install_dir: string;
    toolchain_index_url_override: null;
}
