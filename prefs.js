/* exported init, buildPrefsWidget */

const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const PREFS_UI = `${Me.dir.get_path()}/prefs.xml`;
const PREFS_SCHEMA = 'org.gnome.shell.extensions.historymanager-prefix-search';

/** GNOME Shell Extension API */
function init() {
    ExtensionUtils.initTranslations();
}

const HistoryManagerPrefixSearchPrefsWidget = GObject.registerClass(
class HistoryManagerPrefixSearchPrefsWidget
    extends Gtk.Box {
    _init(params) {
        super._init(params);

        this._settings = ExtensionUtils.getSettings(PREFS_SCHEMA);

        let builder = new Gtk.Builder();
        builder.set_translation_domain(Me.metadata['gettext-domain']);

        builder.add_from_file(PREFS_UI);

        this._main_container = builder.get_object('main-container');
        this._page_keys = builder.get_object('page-keys');
        this._arrow_keys = builder.get_object('arrow-keys');

        this._fillData(builder);
        this._connectSignals(builder);

        this.append(this._main_container);
    }

    _fillData() {
        switch (this._settings.get_int('key-previous')) {
        case Clutter.KEY_Page_Up:
        default:
            this._page_keys.set_active(true);
            break;

        case Clutter.KEY_Up:
            this._arrow_keys.set_active(true);
            break;
        }
    }

    _connectSignals() {
        this._page_keys.connect('toggled', radioButton => {
            if (radioButton.active) {
                this._settings.set_int('key-previous', Clutter.KEY_Page_Up);
                this._settings.set_int('key-next', Clutter.KEY_Page_Down);
            }
        });

        this._arrow_keys.connect('toggled', radioButton => {
            if (radioButton.active) {
                this._settings.set_int('key-previous', Clutter.KEY_Up);
                this._settings.set_int('key-next', Clutter.KEY_Down);
            }
        });
    }
});

/** GNOME Shell Extension API */
function buildPrefsWidget() {
    let widget = new HistoryManagerPrefixSearchPrefsWidget();
    widget.show();
    return widget;
}
