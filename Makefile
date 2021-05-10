default_target: all

po_files := $(wildcard ./po/*.po)

.PHONY: all clean pot schemas zip

all: update_dependencies schemas locales

clean:
	rm -f historymanager-prefix-search.zip
	rm -f ./schemas/gschemas.compiled

update_dependencies:
	git submodule update --init

check: update_dependencies
	npm run check

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

release: increase_version zip

zip: all
	zip -rq historymanager-prefix-search.zip \
		CHANGELOG.md \
		COPYING \
		README.md \
		*.js \
		metadata.json \
		prefs.xml \
        stylesheet.css \
        locale/* \
        schemas/*
