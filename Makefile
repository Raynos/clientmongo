REPORTER = spec

web:
	node ./examples/web/server.js

test-builder:
	browserify ./test/clientmongo.js \
		--o ./test/test.js \
		--watch \
		--require buffer

test-server:
	node ./test/server.js

test-run:
	/opt/google/chrome/google-chrome --enable-plugins localhost:3000

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--ui tdd \
		--bail \
		--reporter $(REPORTER) \
		./test/clientmongo.js

.PHONY: web test-server test-run test test-builder
