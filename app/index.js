'use strict';

var fs = require('fs');
var path = require('path');
var tmp = require('tmp');

var _ = require('lodash');
var askName = require('inquirer-npm-name');
var generators = require('yeoman-generator');
var which = require('which');

function abbrev(name) {
  return name
  .replace(/^draft-/, '')
  .replace(/\.md$/, '')
  .replace(/-/g, ' ');
}
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
      abbrev: this.pkg.abbrev,
      description: this.pkg.description,
      version: this.pkg.version,
      keywords: this.pkg.keywords
    };

    if (this.pkg.homepage) {
      var m = this.pkg.homepage.match(/https:\/\/github.com\/([^\/]+)\/([^\/]+)/)
      if (m) {
        this.props.githubUser = m[1];
        this.props.repo = m[1] + '/' + m[2];
      }
    }

    if (!this.props.githubUser) {
      var done = this.async();
      this.user.github.username(function(er, nm) {
        this.props.githubUser = nm;
        done();
      }.bind(this));
    }
  },
  prompting: {
    askForModuleName: function () {
      if (this.pkg.name || this.options.name) {
        this.props.name = this.pkg.name || _.kebabCase(this.options.name);
        return;
      }
      return askName({
        name: 'name',
        message: 'Draft Name',
        default: path.basename(process.cwd()),
        filter: _.kebabCase,
        validate: function (str) {
          return str.length > 0;
        }
      }, this)
      .then((answer) => {
        this.props.name = answer.name;
      })
    },

    askFor: function () {
      var prompts = [{
        name: 'description',
        message: 'Description',
        when: !this.props.description
      }, {
        name: 'abbrev',
        message: 'Abbreviated Name',
        when: !this.props.abbrev,
        default: abbrev(this.props.name)
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
          return words.split(/\s*,\s*/g).filter(s => s.trim().length > 0);
        }
      }, {
        name: 'repo',
        message: 'Github repository',
        when: !this.props.repo,
        default: this.props.githubUser + '/' + this.props.name
      }];

      return this.prompt(prompts)
      .then((props) => {
        this.props = _.merge(this.props, props);
      })
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

    indexHTML: function () {
      this.fs.copyTpl(
        this.templatePath('index'),
        this.destinationPath('index.html'),
        {
          date: this.now,
          repo: this.props.repo,
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
        homepage: 'https://github.com/' + this.props.repo,
        repository: {
          type: 'git',
          url: 'git+https://github.com/' + this.props.repo + '.git'
        },
        bugs: {
          url: 'https://github.com/' + this.props.repo + '/issues'
        },
        keywords: [],
        scripts: {
          start: "gulp"
        },
        devDependencies: {
          del: "2.2",
          gulp: "3.9",
          "gulp-live-server": "0.0",
          "gulp-rename": "1.2",
          "gulp-util": "3.0",
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
          abbrev: this.props.abbrev,
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
    which('git', function(er, git) {
      if (er) {
        return that.log('git not found.  Skipping "git init"');
      }
      if (!fs.existsSync('.git')) {
        that.spawnCommandSync(git, ['init'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['add', '.gitignore'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['commit', '-m', 'initial yo commit'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['checkout', '--orphan', 'gh-pages'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['rm', '-f', '.gitignore'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['add', 'index.html'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['commit', '-m', 'initial yo commit'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['checkout', 'master'], {
          cwd: that.destinationPath()
        });
        that.fs.delete(that.destinationPath('index.html'));
        that.spawnCommandSync(git, ['add', '.'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['commit', '-m', 'initial yo commit'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['remote', 'add', 'origin', 'git+https://github.com/' + that.props.repo + '.git'], {
          cwd: that.destinationPath()
        });
        that.spawnCommandSync(git, ['worktree', 'add', 'output', 'gh-pages'], {
          cwd: that.destinationPath()
        });
      }
      that.installDependencies({
        npm: true,
        bower: false,
        skipInstall: that.options['skip-install'],
        callback: () => {
          done();
        }
      });
    });
  },
  end: function () {
    this.log("Now run `npm start`.  A browser window should pop up.")
  }
});
