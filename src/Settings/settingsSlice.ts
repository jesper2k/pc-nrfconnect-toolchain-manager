/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    persistedHideOlderEnvironments,
    persistedEnabledVsCode,
    setPersistedHideOlderEnvironments,
    setPersistedEnabledVsCode,
} from '../persistentStore';
import { RootState } from '../state';

export interface SettingsState {
    isVsCodeVisible: boolean;
    isOlderEnvironmentsHidden: boolean;
}

const initialState: SettingsState = {
    isVsCodeVisible: persistedEnabledVsCode(),
    isOlderEnvironmentsHidden: persistedHideOlderEnvironments(),
};

const slice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        enableVsCode: (state, action: PayloadAction<boolean>) => {
            setPersistedEnabledVsCode(action.payload);
            state.isVsCodeVisible = action.payload;
        },
        showOlderEnvironments: (state, action: PayloadAction<boolean>) => {
            setPersistedHideOlderEnvironments(action.payload);
            state.isOlderEnvironmentsHidden = action.payload;
        },
    },
});

export const {
    reducer,
    actions: { enableVsCode, showOlderEnvironments },
} = slice;

export const isVsCodeEnabled = ({ app: { settings } }: RootState) =>
    settings.isVsCodeVisible;

export const isOlderEnvironmentsHidden = ({ app: { settings } }: RootState) =>
    settings.isOlderEnvironmentsHidden;
