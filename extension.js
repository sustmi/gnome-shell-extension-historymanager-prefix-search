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

const History = imports.misc.history;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Prefs = Me.imports.prefs;

let historyManagerInjections;
let settings;

function resetState() {
    historyManagerInjections = {};
}

function enable() {
    resetState();

    historyManagerInjections['prevItemPrefix'] = undefined;
    historyManagerInjections['nextItemPrefix'] = undefined;
    historyManagerInjections['_onEntryKeyPress'] = undefined;

    historyManagerInjections['prevItemPrefix'] = injectAfterFunction(History.HistoryManager.prototype, 'prevItemPrefix', function(text, prefix) {
        for (let i = this._historyIndex - 1; i >= 0; i--) {
            if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }

        return text;
    });

    historyManagerInjections['nextItemPrefix'] = injectAfterFunction(History.HistoryManager.prototype, 'nextItemPrefix', function(text, prefix) {
        for (let i = this._historyIndex + 1; i < this._history.length; i++) {
            if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }

        return text;
    });

    historyManagerInjections['_onEntryKeyPress'] = overrideFunction(History.HistoryManager.prototype, '_onEntryKeyPress', function(entry, event) {
        let symbol = event.get_key_symbol();

        let prevKey = settings.get_int('key-previous');
        let nextKey = settings.get_int('key-next');

        if (symbol === prevKey) {
            let pos = (entry.get_cursor_position() !== -1) ? entry.get_cursor_position() : entry.get_text().length;
            if (pos > 0) {
                this.prevItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
            } else {
                this._setPrevItem(entry.get_text().trim());
            }
            entry.set_selection(pos, pos);

            return true;
        } else if (symbol === nextKey) {
            let pos = (entry.get_cursor_position() !== -1) ? entry.get_cursor_position() : entry.get_text().length;
            if (pos > 0) {
                this.nextItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
            } else {
                this._setNextItem(entry.get_text().trim())
            }
            entry.set_selection(pos, pos);

            return true;
        }
    });

}

function overrideFunction(objectPrototype, functionName, injectedFunction) {
    let originalFunction = objectPrototype[functionName];

    objectPrototype[functionName] = function() {
        let returnValue = injectedFunction.apply(this, arguments);

        if (returnValue === undefined && originalFunction !== undefined) {
            returnValue = originalFunction.apply(this, arguments);
        }

        return returnValue;
    };

    return originalFunction;
}

function injectAfterFunction(objectPrototype, functionName, injectedFunction) {
    let originalFunction = objectPrototype[functionName];

    objectPrototype[functionName] = function() {
        let returnValue;

        if (originalFunction !== undefined) {
        	returnValue = originalFunction.apply(this, arguments);
        }

        let injectedReturnValue = injectedFunction.apply(this, arguments);
        if (injectedReturnValue !== undefined) {
            returnValue = injectedReturnValue;
        }

        return returnValue;
    };

    return originalFunction;
}

function removeInjection(objectPrototype, injection, functionName) {
    if (injection[functionName] === undefined) {
        delete objectPrototype[functionName];
    } else {
        objectPrototype[functionName] = injection[functionName];
    }
}

function disable() {
    for (let i in historyManagerInjections) {
        removeInjection(History.HistoryManager.prototype, historyManagerInjections, i);
    }
    resetState();
}

function init() {
    settings = Convenience.getSettings(Prefs.PREFS_SCHEMA);
}

// 3.0 API backward compatibility
function main() {
    init();
    enable();
}
