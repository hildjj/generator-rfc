'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var askName = require('inquirer-npm-name');
var generators = require('yeoman-generator');
var which = require('which');

module.exports = generators.Base.extend({
  constructor: function () {
    generators.Base.apply(this, arguments);
    this.now = (new Date).toISOString().split('T')[0];

    this.option('name', {
      type: String,
      required: false,
      desc: 'Project name'
    });

    this.option('skip-install',  {
      desc: 'Skip npm install',
      type: Boolean,
      defaults: false
    });
  },
  _insName: function(cur) {
    var an = cur.authorName || this.props.authorName;
    if (!an) {
      return "";
    }
    an = an.split(/\s+/);
    if (an.length < 2) {
      return this.props.authorName;
    }
    return an[0][0] + '. ' + an[an.length-1];
  },
  _guessOrg: function(cur) {
    var em = cur.authorEmail || this.user.git.email();
    if (!em) {
      return "";
    }
    var m = em.match(/@([^.]+)/);
    if (!m) {
      return "";
    }
    return m[1];
  },
  initializing: function () {
    this.gen_pkg = require('../package.json');
    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    // Pre set the default props from the information we have at this point
    this.props = {
      name: this.pkg.name,
      description: this.pkg.description,
      version: this.pkg.version,
      homepage: this.pkg.homepage,
      keywords: this.pkg.keywords
    };
  },
  prompting: {
    askForModuleName: function () {
      if (this.pkg.name || this.options.name) {
        this.props.name = this.pkg.name || _.kebabCase(this.options.name);
        return;
      }

      var done = this.async();

      askName({
        name: 'name',
        message: 'Draft Name',
        default: path.basename(process.cwd()),
        filter: _.kebabCase,
        validate: function (str) {
          return str.length > 0;
        }
      }, this, function (name) {
        this.props.name = name;
        done();
      }.bind(this));
    },

    askFor: function () {
      var done = this.async();

      var prompts = [{
        name: 'description',
        message: 'Description',
        when: !this.props.description
      }, {
        name: 'authorName',
        message: 'Author\'s Name',
        when: !this.props.authorName,
        default: this.user.git.name(),
        store: true
      }, {
        name: 'authorIns',
        message: 'Author\'s Initials + Surname',
        when: !this.props.authorIns,
        default: this._insName,
        store: true
      }, {
        name: 'authorEmail',
        message: 'Author\'s Email',
        when: !this.props.authorEmail,
        default: this.user.git.email(),
        store: true
      }, {
        name: 'authorOrg',
        message: 'Author\'s organization',
        when: !this.props.authorOrg,
        default: this._guessOrg,
        store: true
      }, {
        name: 'keywords',
        message: 'Draft keywords (comma to split)',
        when: !this.props.keywords,
        filter: function (words) {
          return words.split(/\s*,\s*/g);
        }
      }];

      this.prompt(prompts, function (props) {
        this.props = _.merge(this.props, props);
        done();
      }.bind(this));
    },
  },

  writing: {
    gulpfile: function () {
      this.fs.copyTpl(
        this.templatePath('gulpfile.js'),
        this.destinationPath('gulpfile.js'),
        {
          date: this.now,
          name: _.kebabCase(this.props.name),
          gen_name: this.gen_pkg.name,
          gen_version: this.gen_pkg.version
        }
      );
    },

    packageJSON: function () {
      var currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});

      var pkg = _.merge({
        name: _.kebabCase(this.props.name),
        version: '0.0.0',
        author: {
          name: this.props.authorName,
          email: this.props.authorEmail
        },
        description: this.props.description,
        homepage: this.props.homepage,
        keywords: [],
        scripts: {
          start: "gulp"
        },
        devDependencies: {
          del: "2.2",
          gulp: "3.9",
          "gulp-live-server": "0.0",
          "gulp-rename": "1.2",
          "gulp-run": "1.6",
          open: "0.0",
          through2: "2.0"
        },
        license: "SEE LICENSE IN http://trustee.ietf.org/docs/IETF-Trust-License-Policy.pdf",
      }, currentPkg);

      if (this.props.keywords) {
        pkg.keywords = _.uniq(this.props.keywords.concat(pkg.keywords));
      }

      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    },

    copies: function() {
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore')
      );
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
    },

    README: function() {
      this.fs.copyTpl(
        this.templatePath('README.md'),
        this.destinationPath('README.md'),
        {
          date: this.now,
          name: _.kebabCase(this.props.name),
          props: this.props,
          gen_name: this.gen_pkg.name,
          gen_version: this.gen_pkg.version
        }
      );
    },

    draft: function () {
      this.fs.copyTpl(
        this.templatePath('draft.md'),
        this.destinationPath(_.kebabCase(this.props.name) + ".md"),
        {
          date: this.now,
          name: _.kebabCase(this.props.name),
          props: this.props,
          gen_name: this.gen_pkg.name,
          gen_version: this.gen_pkg.version
        }
      );
    },
  },
  install: function () {
    var done = this.async();
    var that = this;
    which('git', function(er, path) {
      if (!er) {
        if (!fs.existsSync('.git')) {
          that.spawnCommandSync('git', ['init'], {
            cwd: that.destinationPath()
          });
          that.spawnCommandSync('git', ['add', '.'], {
            cwd: that.destinationPath()
          });
          that.spawnCommandSync('git', ['commit', '-m', 'initial yo commit'], {
            cwd: that.destinationPath()
          });
          // TODO:
          // * git remote add (to GitHub)
        }
      } else {
        that.log('git not found.  Skipping "git init"');
      }
      done();
    });
    this.installDependencies({
      npm: true,
      bower: false,
      skipInstall: this.options['skip-install']
    });
  }
});
