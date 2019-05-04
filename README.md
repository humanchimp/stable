# :racehorse: stable

    Hold your horses!

[![codecov](https://codecov.io/gh/humanchimp/stable/branch/master/graph/badge.svg?token=mYDCN5PRsc)](https://codecov.io/gh/humanchimp/stable)

`stable` is a BDD framework for javascript and TypeScript. It's designed to be self contained and simple to use.

## status

Not yet production ready. A list of _known_ defects follows. There are probably others.

- It has most of the desired semantics of a "1.0", but some corners have been cut implementation-wise.
- Performance is likely to be not great, as it has been left as an exercise to make a good performing implementation after the semantics are locked in and all the necessary testing is in place.
- It has a lot of tests, but not enough. The coverage badge is currently misleading because at the present moment, only imported files are being considered in the report. The framework is 100% code coverage-wise, but the CLI is only partially tested, and some of the in-flight things, in particular, lack proper testing.
- It lacks documentation.

As stated in its [LICENSE](LICENSE), use it at your own risk.

## installation

    You can lead a horse to water but you can't make him drink

### npm

```bash
npm install @topl/stable --save-dev
```

## usage

    Now I don't know, but I been told
    If the horse don't pull you got to carry the load.

### cli

```
Usage: stable <run bundle config help parse-options> <file(s)/dir(s)> [options]

🐎 run

If files are passed, start there, find .stablercs. If no files passed, start with the .stablerc in the pwd. Run every suite we find with the correct .stablerc.

📦 bundle

Produce bundle artifacts, but don't run any tests.

⚙️ config

Print the config to stdout after performing the algorithm to load it relative to the given path, else the pwd. Stream the reports to stdout

🙃 help

Print this message.

🥢 parse-options

Parse argv; print result

Options:

--read-stdin       	read stdin. [boolean] [default: false]
-f, --filter       	a substring match to filter by suite description. [string]
-g, --grep         	a JavaScript regular expression to use for filtering by suite description. [string]
-r, --runner       	the runner to use. [string]
--force            	force the use of the specified runner even against conflicting directives [boolean]
-o, --output-format	the format of the output stream. [string]
--sort             	the sort algorithm used when visiting the specs. By default, specs are shuffled using the Fisher-Yates algorithm. You can defeat this feature by passing --sort=ordered. [string] [default: shuffle]
--ordered          	a convenient shorthand for --sort=ordered. [boolean]
--partitions       	the total of partitions to divide the specs by. [number]
--partition        	the partition to run and report. [number]
--shard            	a shorthand notation of partition/partitions. [string]
--seed             	for seeding the random number generator used by the built-in shuffle algorithm. [string]
--rollup           	path to the rollup config for your project. [string] [default: rollup.config.js]
--onready          	the name of a function to call when "ready". [string] [default: run]
--bundle-file      	the name of the file of the output bundle. if we end up with multiple bundles, we'll start numbering them [string] [default: bundle.js]
--bundle-format    	the format of the outpout bundle [string] [default: iife]
--coverage         	unclear what function this serves at this point [string or boolean] [default: false]
--hide-skips       	hide skipped specs from the stream. [string or boolean] [default: focus]
--fail-fast        	exit immediately when something is not ok [boolean] [default: true]
--port             	the port to listen on whenever stable needs an http server. [number] [default: 10001]
--headful          	run the user agent headfully [boolean] [default: false]
-v, --verbose      	be chattier. [boolean] [default: false]
-q, --quiet        	don't send an exit code on failure. [boolean] [default: false]
--working-directory	a path to use instead of the pwd. [string] [default: /Users/thorn/Desktop/stable]
-h, --help         	print this message. [boolean] [default: false]
```

### package.json

```json
"scripts": {
  "test": "stable",
  "cover": "nyc stable"
},
```

It makes sense to disable `nyc` instrumentation, since `stable` performs code instrumentation itself.

```json
"nyc": {
  "instrument": false
},
 ```

## configuration

Optionally, you can control your configuration with finer grain using file-relative `.stablerc` files.

`.stablerc` files can inherit from each other using an explicit `extends` directive, enabling local and global configuration.

For instance, say you have some code meant to run in node, and some other code meant to run in both node and in browsers. You could define your configuration like this:

```yaml
plugins:
- - timing
  - timeout: 200
```
_Figure 1_: `project/.stablerc` Global configuration.

```yaml
extends: ..
runners:
- isolate
- chrome
- jsdom
```
_Figure 2_: `project/spec/lib/.stablerc` The configuration for tests meant to run in both node and browsers.

```yaml
extends: ..
runners:
- isolate
```
_Figure 3_: `project/spec/server/.stablerc` The configuration for tests meant to run only in node.

```yaml
extends: ..
runners:
- chrome
- jsdom
```
_Figure 4_: `project/spec/ui/.stablerc` The configuration for tests meant to run only in browsers.

These files contain YAML (or JSON) dictionaries and are capable of configuring plugins and enabling runners by default. In practice, runners probably need to be overridden in CI because you probabaly want to use separate [containers](./cloud-builders) to run your tests against various browsers.

![](https://media.giphy.com/media/CwZGPdbie0z2o/giphy.gif)

## code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## license

See [LICENSE](LICENSE)
