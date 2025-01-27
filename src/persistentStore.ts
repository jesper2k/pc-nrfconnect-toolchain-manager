/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import os from 'os';
import path from 'path';
import { getPersistentStore as store } from 'pc-nrfconnect-shared';

import getNrfutilConfig from './Manager/nrfutil/config';

export const defaultInstallDir = getNrfutilConfig().install_dir;
export const oldDefaultInstallDirOnWindows = path.resolve(os.homedir(), 'ncs');

export const persistedInstallDir = (): string =>
    process.platform === 'darwin'
        ? defaultInstallDir ?? ''
        : store().get('installDir', defaultInstallDir ?? '');

export const setPersistedInstallDir = (dir: string) =>
    store().set('installDir', dir);

export const usesDefaultInstallDir = () => !store().has('installDir');

const indexJson =
    {
        win32: 'index.json',
        darwin: 'index-mac.json',
        linux: 'index-linux.json',
        aix: undefined,
        android: undefined,
        cygwin: undefined,
        freebsd: undefined,
        netbsd: undefined,
        openbsd: undefined,
        sunos: undefined,
    }[process.platform] ?? 'index-linux.json';

export const toolchainIndexUrl = () => {
    const value = store().get(
        'toolchainIndexUrl',
        'https://developer.nordicsemi.com/.pc-tools/toolchain'
    ) as string;
    return `${value.replace(/\/index.*.json$/, '')}/${indexJson}`;
};
export const toolchainUrl = (name: string) =>
    `${path.dirname(toolchainIndexUrl())}/${name}`;
export const setToolchainIndexUrl = (value: string) =>
    store().set('toolchainIndexUrl', value);

export const persistedShowMaster = () => store().get('showMaster', false);
export const setPersistedShowMaster = (visible: boolean) =>
    store().set('showMaster', visible);

export const persistedHideOlderEnvironments = () =>
    store().get('hideOlderEnvironments', true);
export const setPersistedHideOlderEnvironments = (visible: boolean) =>
    store().set('hideOlderEnvironments', visible);

export const persistedShowVsCodeDialogDuringInstall = () =>
    store().get('showVsCodeDialogDuringInstall', true);
export const setPersistedShowVsCodeDialogDuringInstall = (visible: boolean) =>
    store().set('showVsCodeDialogDuringInstall', visible);
