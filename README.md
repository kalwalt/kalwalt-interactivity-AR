<span class="badge-patreon"><a href="https://patreon.com/walterperdan" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
[![Build Status](https://travis-ci.com/kalwalt/kalwalt-interactivity-AR.svg?branch=master)](https://travis-ci.com/kalwalt/kalwalt-interactivity-AR)
# kalwalt-interactivity-AR
Some various experiments with [Ar.js](https://github.com/AR-js-org/AR.js) and [Three.js](https://threejs.org/) and not only.
Note that some of them maybe can not works... It's my notebook, block of sketches of small applications or fragments of code that I am testing.

## NFT and Jsartoolkit5
In the repository there are some examples not included in the official [artoolkitx/jsartoolkit5](https://github.com/artoolkitx/jsartoolkit5) repository.

## nftLoader
Note nftLoader is deprecated and removed from this repository, i suggest you to use the new [ARnft](https://github.com/webarkit/ARnft) library, based on [JsartoolkitNFT](https://github.com/webarkit/jsartoolkitNFT) and with ES6. You can still look at the code in this release [0.5.0](https://github.com/kalwalt/kalwalt-interactivity-AR/releases/tag/0.5.0).

## Website
You can visit the Website [kalwalt.github.io/kalwalt-interactivity-AR/](https://kalwalt.github.io/kalwalt-interactivity-AR/) The site is hosted on gh-pages.

## How to run things locally

You should run a local server, if you have python run in a console:

```python
// Python 2.x
python -m SimpleHTTPServer

// Python 3.x
python -m http.server
```

or with node.js install the server package:

```
npm install http-server -g
```

and than run:

```
http-server . -p 8000
```
