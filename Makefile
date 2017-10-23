.PHONY: zip

zip:
	zip -rq historymanager-prefix-search.zip \
		COPYING \
		README.md \
		*.js \
		metadata.json \
		stylesheet.css
