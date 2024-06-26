default_target: all

po_files := $(wildcard ./po/*.po)

.PHONY: all clean update_dependencies check pot schemas increase_version release zip

all: update_dependencies schemas locales

clean:
	rm -f historymanager-prefix-search.zip
	rm -f ./schemas/gschemas.compiled

update_dependencies:
	git submodule update --init
	git submodule update --recursive --remote

check:
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

release: zip

zip: all
	rm -f historymanager-prefix-search.zip
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
