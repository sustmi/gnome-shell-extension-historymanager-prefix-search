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

const History = imports.misc.history;

const ExtensionUtils = imports.misc.extensionUtils;

let historyManagerInjections = {};
let settings;

/** GNOME Shell Extension API */
function enable() {
    settings = ExtensionUtils.getSettings();

    historyManagerInjections['prevItemPrefix'] = undefined;
    historyManagerInjections['nextItemPrefix'] = undefined;
    historyManagerInjections['_onEntryKeyPress'] = undefined;

    historyManagerInjections['prevItemPrefix'] = injectAfterFunction(History.HistoryManager.prototype, 'prevItemPrefix', function (text, prefix) {
        for (let i = this._historyIndex - 1; i >= 0; i--) {
            if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }

        return text;
    });

    historyManagerInjections['nextItemPrefix'] = injectAfterFunction(History.HistoryManager.prototype, 'nextItemPrefix', function (text, prefix) {
        for (let i = this._historyIndex + 1; i < this._history.length; i++) {
            if (this._history[i].indexOf(prefix) === 0 && this._history[i] !== text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }

        return text;
    });

    historyManagerInjections['_onEntryKeyPress'] = overrideFunction(History.HistoryManager.prototype, '_onEntryKeyPress', function (entry, event) {
        let symbol = event.get_key_symbol();

        let prevKey = settings.get_int('key-previous');
        let nextKey = settings.get_int('key-next');

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
    });
}

/**
 * @param {object} objectPrototype - object prototype to be modified
 * @param {string} functionName - name of the function to be overriden
 * @param {Function} injectedFunction - new function to be injected instead of @functionName
 */
function overrideFunction(objectPrototype, functionName, injectedFunction) {
    let originalFunction = objectPrototype[functionName];

    objectPrototype[functionName] = function (...args) {
        let returnValue = injectedFunction.apply(this, args);

        if (returnValue === undefined && originalFunction !== undefined)
            returnValue = originalFunction.apply(this, args);

        return returnValue;
    };

    return originalFunction;
}

/**
 * @param {object} objectPrototype - object prototype to be modified
 * @param {string} functionName - name of the original function after which @injectedFunction will be executed
 * @param {Function} injectedFunction - new function to be executed after @functionName
 */
function injectAfterFunction(objectPrototype, functionName, injectedFunction) {
    let originalFunction = objectPrototype[functionName];

    objectPrototype[functionName] = function (...args) {
        let returnValue;

        if (originalFunction !== undefined)
            returnValue = originalFunction.apply(this, args);

        let injectedReturnValue = injectedFunction.apply(this, args);
        if (injectedReturnValue !== undefined)
            returnValue = injectedReturnValue;

        return returnValue;
    };

    return originalFunction;
}

/**
 * @param {object} objectPrototype - object prototype to be modified
 * @param {Function} injection - original function to be returned to the @objectPrototype
 * @param {Function} functionName - name of the function in the @objectPrototype
 */
function removeInjection(objectPrototype, injection, functionName) {
    if (injection[functionName] === undefined)
        delete objectPrototype[functionName];
    else
        objectPrototype[functionName] = injection[functionName];
}

/** GNOME Shell Extension API */
function disable() {
    for (let i in historyManagerInjections)
        removeInjection(History.HistoryManager.prototype, historyManagerInjections, i);

    settings = null;
}

/** GNOME Shell Extension API */
function init() {
}

/**
 * 3.0 API backward compatibility
 */
function main() {
    init();
    enable();
}
