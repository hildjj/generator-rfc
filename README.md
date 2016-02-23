# generator-rfc

> Use [yeoman][] to create a project to edit an Internet-Draft/RFC from
> markdown, including web server that does live refreshes of a web page as
> the source changes.

[yeoman]: http://gruntjs.com/project-scaffolding

## Installation
Make sure [yeoman][] and this package are installed:

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

Answer a couple of questions.  

Then start the server:

```
gulp
```

Your default web browser will pop up with a skeleton RFC.  Edit the
draft-*.md file in your favorite text editor.  When you save the file...
look at your browser window.
