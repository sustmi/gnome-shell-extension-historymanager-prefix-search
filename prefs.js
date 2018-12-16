const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const PREFS_UI = Me.dir.get_path() + '/prefs.xml';
const PREFS_SCHEMA = 'org.gnome.shell.extensions.historymanager-prefix-search';

function init() {
    Convenience.initTranslations();
}

const PreferencesWidget = new GObject.Class({
    Name: 'HistoryManagerPrefixSearchExtension.Prefs.Widget',
    GTypeName: 'HistoryManagerPrefixSearchExtensionPrefsWidget',
    Extends: Gtk.Box,
    
    _init: function(params) {
        this.parent(params);
        
        this._settings = Convenience.getSettings(PREFS_SCHEMA);

        let builder = new Gtk.Builder();
        builder.set_translation_domain(Me.metadata['gettext-domain']);
        
        builder.add_from_file(PREFS_UI);

        this._main_container = builder.get_object('main-container');
        this._page_keys = builder.get_object('page-keys');
        this._arrow_keys = builder.get_object('arrow-keys');

        this._fillData(builder);
        this._connectSignals(builder);
        
        this.add(this._main_container);
    },
    
    _fillData: function(builder) {
        switch (this._settings.get_int('key-previous')) {
            case Clutter.KEY_Page_Up:
            default:
                this._page_keys.set_active(true);
                break;

            case Clutter.KEY_Up:
                this._arrow_keys.set_active(true);
                break;
        }
    },
    
    _connectSignals: function(builder) {
        this._page_keys.connect('toggled', Lang.bind(this, function(radioButton) {
            if (radioButton.active) {
                this._settings.set_int('key-previous', Clutter.KEY_Page_Up);
                this._settings.set_int('key-next', Clutter.KEY_Page_Down);
            }
        }));

        this._arrow_keys.connect('toggled', Lang.bind(this, function(radioButton) {
            if (radioButton.active) {
                this._settings.set_int('key-previous', Clutter.KEY_Up);
                this._settings.set_int('key-next', Clutter.KEY_Down);
            }
        }));
    }
});

function buildPrefsWidget() {
    let widget = new PreferencesWidget();
    widget.show_all();
    return widget;
}
