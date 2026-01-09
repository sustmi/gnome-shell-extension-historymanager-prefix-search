default_target: all

po_files := $(wildcard ./po/*.po)

.PHONY: all clean update_dependencies check fix pot schemas increase_version release zip

all: update_dependencies schemas locales

clean:
	rm -f historymanager-prefix-search.zip
	rm -f ./schemas/gschemas.compiled

update_dependencies:
	git submodule update --init
	git submodule update --recursive --remote

check:
	npm run check

fix:
	npm run fix

pot:
	xgettext --language=Glade --output=./po/historymanager-prefix-search.pot prefs.xml

schemas:
	glib-compile-schemas ./schemas

locales: $(po_files)
	for FILE in $(po_files); do \
		LOCALE=`basename $$FILE .po`; \
		mkdir -p ./locale/$$LOCALE/LC_MESSAGES; \
		msgfmt -o ./locale/$$LOCALE/LC_MESSAGES/historymanager-prefix-search.mo ./po/$$LOCALE.po; \
	done

increase_version:
	jq --indent 4 ".version |= .+1" < metadata.json | sponge metadata.json

release: zip

zip:
	gnome-extensions pack ./ \
		--force \
		--podir=po \
		--extra-source=CHANGELOG.md \
		--extra-source=COPYING \
		--extra-source=README.md
