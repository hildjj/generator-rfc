# generator-rfc

> Use [yeoman][] to create a project to edit an Internet-Draft/RFC from
> markdown, including web server that does live refreshes of a web page as
> the source changes.

[yeoman]: http://yeoman.io/

## Quick start

```
gem install kramdown-rfc2629
pip install xml2rfc
brew install npm  # see: https://nodejs.org/en/ for downloads
npm install -g yo generator-rfc
mkdir draft-foo
cd draft-foo
yo rfc
# answer some questions
# lots of node modules get installed into the `node_modules` subdirectory
npm start
```

## Installation
[Nodejs](https://nodejs.org/en/) is required.

Use node's package manager to ensure [yeoman][] and this package are installed:

```
npm install -g yo generator-rfc
```

You'll also need:

[xml2rfc v2.4.5 or higher](https://pypi.python.org/pypi/xml2rfc), which I
suggest installing with:

```
pip install xml2rfc
```

and also:

[kramdown-rfc2629](https://github.com/cabo/kramdown-rfc2629), which can be
installed with:

```
gem install kramdown-rfc2629
```

## Usage

At the command-line, cd into an empty directory, run this command and follow
the prompts.

```
yo rfc
```

_Note that this template will generate files in the current directory, so be
sure to change to a new directory first if you don't want to overwrite existing
files._

Answer a couple of questions.  Unless you specify `--skip-install` in the `yo`
command, `npm install` will run automatically, populating the `node_modules`
directory with all of the nodejs packages necessary to run the system.  Yes,
there are a lot of them, but they install relatively quickly.  Node developers
tend to make lots of tiny packages, and reuse more aggressively than other
communities.

Then start the server:

```
npm start
```

Your default web browser will pop up with a skeleton RFC.  Edit the
draft-*.md file in your favorite text editor.  When you save the file...
look at your browser window.
