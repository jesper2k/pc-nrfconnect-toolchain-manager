/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec, ExecException, execSync } from 'child_process';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const launchWinBash = (version: string) => {
    exec(
        `"${nrfutilToolchainManager()}"  launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" cmd.exe /k start bash.exe`
    );
};

export const launchTerminal = (version: string) => {
    exec(
        `"${nrfutilToolchainManager()}"  launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" --terminal`
    );
};

const execCallback = (
    error: ExecException | null,
    stdout: string,
    stderr: string
) => {
    logger.info('Terminal has closed');
    if (error) usageData.sendErrorReport(error.message);
    if (stderr) usageData.sendErrorReport(stderr);
    if (stdout) logger.debug(stdout);
};

export const launchLinuxTerminal = (version: string) => {
    const terminalApp = execSync(
        'gsettings get org.gnome.desktop.default-applications.terminal exec'
    )
        .toString()
        .trim()
        .replace(/'/g, '');

    const startupScript = execSync(
        `"${nrfutilToolchainManager()}"  env --ncs-version "${version}" --install-dir "${installDir()}" --as-script`,
        { encoding: 'utf-8' }
    );

    exec(
        `"${terminalApp}" -- bash -c "${startupScript} bash"`,
        { cwd: sdkPath(version) },
        execCallback
    );
};
