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
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class HistoryManagerPrefixSearchExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        const _settings = this._settings;

        this._injectionManager = new InjectionManager();

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

        this._injectionManager.overrideMethod(History.HistoryManager.prototype, '_onEntryKeyPress', () => {
            return function (entry, event) {
                /* eslint-disable no-invalid-this */
                let symbol = event.get_key_symbol();

                let prevKey = _settings.get_int('key-previous');
                let nextKey = _settings.get_int('key-next');

                if (symbol === prevKey) {
                    let pos = entry.get_cursor_position() !== -1 ? entry.get_cursor_position() : entry.get_text().length;
                    if (pos > 0)
                        this.prevItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
                    else
                        this._setPrevItem(entry.get_text().trim());

                    entry.set_selection(pos, pos);

                    return true;
                } else if (symbol === nextKey) {
                    let pos = entry.get_cursor_position() !== -1 ? entry.get_cursor_position() : entry.get_text().length;
                    if (pos > 0)
                        this.nextItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
                    else
                        this._setNextItem(entry.get_text().trim());

                    entry.set_selection(pos, pos);

                    return true;
                }

                return Clutter.EVENT_PROPAGATE;
                /* eslint-enable no-invalid-this */
            };
        });
    }

    disable() {
        this._injectionManager.clear();
        this._injectionManager = null;
        this._settings = null;
    }
}
