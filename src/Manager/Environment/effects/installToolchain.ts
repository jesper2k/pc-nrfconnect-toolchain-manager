/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import {
    describeError,
    ErrorDialogActions,
    usageData,
} from 'pc-nrfconnect-shared';

import { Dispatch, Toolchain } from '../../../state';
import installNrfutilToolchain from '../../nrfutil/install';
import {
    finishInstallToolchain,
    isLegacyEnvironment,
    setProgress,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { downloadToolchain } from './downloadToolchain';
import { unpack } from './unpack';

export const installToolchain =
    (
        version: string,
        toolchain: Toolchain,
        toolchainDir: string,
        abortController?: AbortController
    ) =>
    async (dispatch: Dispatch) => {
        if (abortController?.signal.aborted) return;

        dispatch(startInstallToolchain(version));
        abortController?.signal.addEventListener('abort', () => {
            dispatch(finishInstallToolchain(version, toolchainDir, true));
        });

        if (isLegacyEnvironment(version)) {
            try {
                fse.mkdirpSync(toolchainDir);
                const packageLocation = await dispatch(
                    downloadToolchain(version, toolchain)
                );
                await dispatch(unpack(version, packageLocation, toolchainDir));
                updateConfigFile(toolchainDir);
            } catch (error) {
                const message = describeError(error);
                dispatch(ErrorDialogActions.showDialog(message));
                usageData.sendErrorReport(message);
            }
        } else {
            await installNrfutilToolchain(
                version,
                update => {
                    switch (update.type) {
                        case 'task_begin':
                            dispatch(
                                setProgress(
                                    version,
                                    mapKnownDescriptions(
                                        update.data.task.description
                                    )
                                )
                            );
                            break;
                        case 'task_progress':
                            dispatch(
                                setProgress(
                                    version,
                                    mapKnownDescriptions(
                                        update.data.task.description
                                    ),
                                    update.data.progress.progressPercentage
                                )
                            );
                            break;
                    }
                },
                abortController?.signal
            );
        }
        dispatch(finishInstallToolchain(version, toolchainDir));
    };

const mapKnownDescriptions = (description: string) =>
    description
        .replace('Download toolchain', 'Downloading toolchain')
        .replace('Unpack toolchain', 'Unpacking toolchain');
