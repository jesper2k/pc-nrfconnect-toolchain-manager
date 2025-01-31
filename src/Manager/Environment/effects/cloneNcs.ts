/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { ErrorDialogActions, logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { westExport, westInit, westUpdate } from '../../nrfutil/west';
import sdkPath from '../../sdkPath';
import {
    finishCloningSdk,
    isLegacyEnvironment,
    setProgress,
    startCloningSdk,
} from '../environmentReducer';
import { calculateTimeConsumed, isWestPresent } from './helpers';

export const cloneNcs =
    (version: string, toolchainDir: string, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
        dispatch(startCloningSdk(version));
        logger.info(`Cloning nRF Connect SDK ${version}`);

        usageData.sendUsageData(
            EventAction.CLONE_NCS,
            `${version}; ${process.platform}; ${process.arch}`
        );
        const cloneTimeStart = new Date();

        try {
            if (!justUpdate) {
                if (isLegacyEnvironment(version)) {
                    await initLegacy(toolchainDir);
                } else {
                    await initNrfUtil(version, dispatch);
                }
            }

            if (isLegacyEnvironment(version)) {
                await updateLegacy(justUpdate, toolchainDir, dispatch, version);
            } else {
                await updateNrfUtil(version, dispatch);
            }
        } catch (error) {
            const errorMsg = `Failed to clone the repositories: ${error}`;
            dispatch(ErrorDialogActions.showDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
        }

        dispatch(finishCloningSdk(version, isWestPresent(toolchainDir)));

        usageData.sendUsageData(
            EventAction.CLONE_NCS_SUCCESS,
            `${version}; ${process.platform}; ${process.arch}`
        );
        usageData.sendUsageData(
            EventAction.CLONE_NCS_TIME,
            `${calculateTimeConsumed(cloneTimeStart)} min; ${version}`
        );
        logger.info(
            `Finished cloning version ${version} of the nRF Connect SDK after approximately ${calculateTimeConsumed(
                cloneTimeStart
            )} minute(s)`
        );
    };

async function initLegacy(toolchainDir: string) {
    await fse.remove(path.resolve(path.dirname(toolchainDir), '.west'));
}

async function initNrfUtil(version: string, dispatch: Dispatch) {
    await fse.remove(path.resolve(sdkPath(version), '.west'));
    dispatch(setProgress(version, 'Initializing environment...'));
    logger.info(`Initializing environment for ${version}`);
    await westInit(version);
}

async function updateNrfUtil(version: string, dispatch: Dispatch) {
    await westUpdate(version, update => {
        updateProgress(update, dispatch, version);
    });
    await westExport(version);
}

async function updateLegacy(
    justUpdate: boolean,
    toolchainDir: string,
    dispatch: Dispatch,
    version: string
) {
    let ncsMgr: ChildProcess;
    const update = justUpdate ? '--just-update' : '';
    switch (process.platform) {
        case 'win32': {
            ncsMgr = spawn(path.resolve(toolchainDir, 'bin', 'bash.exe'), [
                '-l',
                '-c',
                `unset ZEPHYR_BASE ; ncsmgr/ncsmgr init-ncs ${update}`,
            ]);

            break;
        }
        case 'darwin': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ZEPHYR_BASE, ...env } = process.env;
            const gitversion = fs
                .readdirSync(`${toolchainDir}/Cellar/git`)
                .pop();
            env.PATH = `${toolchainDir}/bin:${process.env.PATH}`;
            env.GIT_EXEC_PATH = `${toolchainDir}/Cellar/git/${gitversion}/libexec/git-core`;
            env.HOME = `${process.env.HOME}`;

            ncsMgr = spawn(
                `${toolchainDir}/ncsmgr/ncsmgr`,
                ['init-ncs', `${update}`],
                { env }
            );
            break;
        }
        default:
    }

    dispatch(setProgress(version, 'Initializing environment...'));
    logger.info(`Initializing environment for ${version}`);
    let err = '';
    await new Promise<void>((resolve, reject) => {
        ncsMgr.stdout?.on('data', data => {
            updateProgress(data, dispatch, version);
        });
        ncsMgr.stderr?.on('data', data => {
            err += `${data}`;
        });
        ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
    });
}

function updateProgress(
    data: Buffer | string,
    dispatch: Dispatch,
    version: string
) {
    const repo = (/=== updating ([^\s]+)/.exec(data.toString()) || []).pop();
    if (repo) {
        dispatch(setProgress(version, `Updating ${repo} repository...`));
        logger.info(`Updating ${repo} repository for ${version}`);
    }
}
