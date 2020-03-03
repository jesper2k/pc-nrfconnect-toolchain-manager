/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {
    ENVIRONMENT_LIST_UPDATE,
    ENVIRONMENT_IN_PROCESS,
    ENVIRONMENT_LIST_CLEAR,
    ENVIRONMENT_REMOVE,
    SET_VERSION_TO_INSTALL,
    CONFIRM_REMOVE_DIALOG_SHOW,
    CONFIRM_REMOVE_DIALOG_HIDE,
    SELECT_ENVIRONMENT,
} from './environmentsActions';

const InitialState = {
    environmentList: [],
    isRemoveDirDialogVisible: false,
    versionToInstall: null,
    versionToRemove: null,
    selectedVersion: null,
};

const reducer = (state = InitialState, action) => {
    switch (action.type) {
        case ENVIRONMENT_LIST_UPDATE:
            return {
                ...state,
                environmentList: action.environmentList,
            };
        case ENVIRONMENT_IN_PROCESS: {
            const { version } = action;
            const { environmentList } = state;
            const envIndex = environmentList.findIndex(v => v.version === version);
            if (envIndex < 0) {
                throw new Error(`No environment version found for ${version}`);
            }
            environmentList[envIndex] = {
                ...environmentList[envIndex],
                isInProcess: action.isInProcess,
            };
            return {
                ...state,
                environmentList: [...environmentList],
            };
        }
        case ENVIRONMENT_LIST_CLEAR:
            return {
                ...state,
                environmentList: [],
            };
        case ENVIRONMENT_REMOVE: {
            const { version } = action;
            const { environmentList } = state;
            const envIndex = environmentList.findIndex(v => v.version === version);
            if (envIndex < 0) {
                throw new Error(`No environment version found for ${version}`);
            }

            const newEnvironmentList = [...environmentList];
            const environementIsOnlyLocal = !environmentList[envIndex].toolchains;
            if (environementIsOnlyLocal) {
                newEnvironmentList.splice(envIndex, 1);
            } else {
                newEnvironmentList[envIndex] = {
                    ...newEnvironmentList[envIndex],
                    toolchainDir: null,
                };
            }

            return {
                ...state,
                environmentList: newEnvironmentList,
            };
        }
        case SET_VERSION_TO_INSTALL: {
            return {
                ...state,
                versionToInstall: action.version,
            };
        }
        case CONFIRM_REMOVE_DIALOG_SHOW: {
            return {
                ...state,
                isRemoveDirDialogVisible: true,
                versionToRemove: action.version,
            };
        }
        case CONFIRM_REMOVE_DIALOG_HIDE: {
            return {
                ...state,
                isRemoveDirDialogVisible: false,
                versionToRemove: null,
            };
        }
        case SELECT_ENVIRONMENT: {
            return {
                ...state,
                selectedVersion: action.selectedVersion,
            };
        }
        default:
            return state;
    }
};

export default reducer;
