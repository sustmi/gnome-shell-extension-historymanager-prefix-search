/* exported init, buildPrefsWidget */

import Adw from 'gi://Adw';
import Clutter from 'gi://Clutter';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class HistoryManagerPrefixSearchExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup();
        page.add(group);

        const controlKeysOptions = new Gtk.StringList();
        controlKeysOptions.append(_('PageUp + PageDown'));
        controlKeysOptions.append(_('KeyUp + KeyDown'));

        const controlKeysComboRow = new Adw.ComboRow({
            title: _('Control keys'),
            model: controlKeysOptions,
            selected: settings.get_int('key-previous') === Clutter.KEY_Page_Up ? 0 : 1,
        });
        controlKeysComboRow.connect(
            'notify::selected',
            comboRow => {
                if (comboRow.selected === 0) {
                    settings.set_int('key-previous', Clutter.KEY_Page_Up);
                    settings.set_int('key-next', Clutter.KEY_Page_Down);
                } else {
                    settings.set_int('key-previous', Clutter.KEY_Up);
                    settings.set_int('key-next', Clutter.KEY_Down);
                }
            }
        );
        group.add(controlKeysComboRow);
    }
}
