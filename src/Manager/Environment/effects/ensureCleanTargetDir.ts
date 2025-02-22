/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { shell } from '@electron/remote';
import fs from 'fs';
import { rm } from 'fs/promises';
import path from 'path';

import { showReduxConfirmDialogAction } from '../../../ReduxConfirmDialog/reduxConfirmDialogSlice';
import { Dispatch } from '../../../state';
import { isLegacyEnvironment } from '../environmentReducer';
import { removeDir } from './removeDir';

export const ensureCleanTargetDir =
    (version: string, toolchainDir: string) => async (dispatch: Dispatch) => {
        if (isLegacyEnvironment(version)) {
            let dir = toolchainDir;
            let toBeDeleted = null;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const westdir = path.resolve(dir, '.west');
                if (fs.existsSync(westdir)) {
                    toBeDeleted = westdir;
                    break;
                }
                const parent = path.dirname(dir);
                if (parent === dir) {
                    break;
                }
                dir = parent;
            }
            if (toBeDeleted) {
                try {
                    await dispatch(confirmRemoveDir(toBeDeleted));
                    await removeDir(dispatch, toBeDeleted);
                } catch (err) {
                    throw new Error(
                        `${toBeDeleted} must be removed to continue installation`
                    );
                }
                await dispatch(ensureCleanTargetDir(version, toolchainDir));
            }
        } else {
            const manifestPath = path.resolve(toolchainDir, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                await rm(manifestPath);
            }
        }
    };

export default ensureCleanTargetDir;

const showReduxConfirmDialog =
    ({ ...args }) =>
    (dispatch: Dispatch) =>
        new Promise<void>((resolve, reject) => {
            dispatch(
                showReduxConfirmDialogAction({
                    callback: canceled => (canceled ? reject() : resolve()),
                    ...args,
                })
            );
        });

const confirmRemoveDir = (directory: string) =>
    showReduxConfirmDialog({
        title: 'Inconsistent directory structure',
        content:
            `The \`${directory}\` directory blocks installation, and should be removed.\n\n` +
            'If this directory is part of manually installed nRF Connect SDK environment, ' +
            'consider changing the installation directory in SETTINGS.\n\n' +
            'If this directory is left over from an incorrect installation, click _Remove_.\n\n' +
            'Should you intend to manually remedy the issue, click _Open folder_. ' +
            'Make sure hidden items are visible.',
        confirmLabel: 'Remove',
        onOptional: () => shell.showItemInFolder(directory),
        optionalLabel: 'Open folder',
    });
