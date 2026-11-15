/* exported enable, disable, init, main */

// Search command history by prefix in Gnome-shell's prompts.
// Copyright (C) 2011 Miroslav Sustek

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import Clutter from 'gi://Clutter';
import * as History from 'resource:///org/gnome/shell/misc/history.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as RunDialog from 'resource:///org/gnome/shell/ui/runDialog.js';
import * as LookingGlass from 'resource:///org/gnome/shell/ui/lookingGlass.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class HistoryManagerPrefixSearchExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        const _settings = this._settings;

        this._injectionManager = new InjectionManager();
        this._controllers = new Map();

        this._injectionManager.overrideMethod(History.HistoryManager.prototype, 'prevItemPrefix', () => {
            return function (text, prefix) {
                /* eslint-disable no-invalid-this */
                for (let i = this._historyIndex - 1; i >= 0; i--) {
                    if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                        this._historyIndex = i;
                        return this._indexChanged();
                    }
                }

                return text;
                /* eslint-enable no-invalid-this */
            };
        });

        this._injectionManager.overrideMethod(History.HistoryManager.prototype, 'nextItemPrefix', () => {
            return function (text, prefix) {
                /* eslint-disable no-invalid-this */
                for (let i = this._historyIndex + 1; i < this._history.length; i++) {
                    if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                        this._historyIndex = i;
                        return this._indexChanged();
                    }
                }

                return text;
                /* eslint-enable no-invalid-this */
            };
        });

        const attach = historyManager => {
            if (!historyManager || !historyManager._entry || this._controllers.has(historyManager))
                return;

            const entry = historyManager._entry;
            const controller = new Clutter.KeyController();
            controller.connect('key-press', () => {
                const [, symbol] = controller.get_key();

                const prevKey = _settings.get_int('key-previous');
                const nextKey = _settings.get_int('key-next');

                if (symbol !== prevKey && symbol !== nextKey)
                    return Clutter.EVENT_PROPAGATE;

                const text = entry.get_text();
                const cursor = entry.get_cursor_position();
                const pos = cursor !== -1 ? cursor : text.length;
                if (symbol === prevKey) {
                    if (pos > 0)
                        historyManager.prevItemPrefix(text, text.slice(0, pos));
                    else
                        historyManager._setPrevItem(text.trim());
                } else if (pos > 0) {
                    historyManager.nextItemPrefix(text, text.slice(0, pos));
                } else {
                    historyManager._setNextItem(text.trim());
                }

                entry.set_selection(pos, pos);

                return Clutter.EVENT_STOP;
            });

            // Capture phase runs before the bubble-phase controller added by HistoryManager itself.
            // Otherwise it would handle Up/Down first (and stop the event), so our prefix search
            // would never run for those keys.
            entry.add_action_full('historymanager-prefix-search', Clutter.EventPhase.CAPTURE, controller);
            this._controllers.set(historyManager, {entry, controller});
        };

        for (const proto of [RunDialog.RunDialog.prototype, LookingGlass.LookingGlass.prototype]) {
            this._injectionManager.overrideMethod(proto, 'open', originalMethod => {
                return function (...args) {
                    /* eslint-disable no-invalid-this */
                    attach(this._history);
                    return originalMethod.call(this, ...args);
                    /* eslint-enable no-invalid-this */
                };
            });
        }

        attach(Main.runDialog?._history);
        attach(Main.lookingGlass?._history);
    }

    disable() {
        this._injectionManager.clear();
        for (const {entry, controller} of this._controllers.values())
            entry.remove_action(controller);
        this._controllers = null;
        this._injectionManager = null;
        this._settings = null;
    }
}
