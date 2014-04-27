var colors = require('colors');
var _ = require('lodash');
var utils = require('../utils');
var list = require('./list');

exports.run = function (args) {
  utils.argShift(args, 'subcommand');
  utils.argShift(args, 'name');

  if (args.name === 'help' && subcommands[args.subcommand].help) {
    return subcommands[args.subcommand].help();
  } else if (args.subcommand && subcommands[args.subcommand]) {
    return subcommands[args.subcommand](args);
  } else {
    return utils.missingCommand(exports.help);
  }
};

var subcommands = {};

subcommands.list = function (args) {
  list.run(args);
};

subcommands.count = function (args) {
  var clusters = utils.getClusters();

  if (!args.name) {
    return utils.missingParameter('[name]', subcommands.count.help);
  } else if (!clusters[args.name]) {
    return utils.die('The cluster "' + args.name + '" wasn\'t found.');
  }

  console.log(_.keys(clusters[args.name].instances).length);
};

subcommands.count.help = function () {
  utils.printArray([
    'overcast cluster count [name]',
    '  Return the number of instances in a cluster.'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast cluster count db'.grey,
    '  > 0'.grey,
    '  $ overcast instance create db.01 --cluster db'.grey,
    '  > ...'.grey,
    '  $ overcast cluster count db'.grey,
    '  > 1'.grey
  ]);
};

subcommands.create = function (args) {
  var clusters = utils.getClusters();

  if (!args.name) {
    return utils.missingParameter('[name]', subcommands.create.help);
  } else if (clusters[args.name]) {
    return utils.grey('The cluster "' + args.name + '" already exists, no action taken.');
  }

  clusters[args.name] = { instances: {} };

  utils.saveClusters(clusters, function () {
    utils.success('Cluster "' + args.name + '" has been created.');
    list.run(args);
  });
};

subcommands.create.help = function () {
  utils.printArray([
    'overcast cluster create [name]',
    '  Creates a new cluster.'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast cluster create db'.grey
  ]);
};

subcommands.rename = function (args) {
  var clusters = utils.getClusters();
  utils.argShift(args, 'newName');

  if (!args.name) {
    return utils.missingParameter('[name]', subcommands.rename.help);
  } else if (!args.newName) {
    return utils.missingParameter('[new-name]', subcommands.rename.help);
  } else if (!clusters[args.name]) {
    return utils.die('The cluster "' + args.name + '" wasn\'t found.');
  } else if (clusters[args.newName]) {
    return utils.die('The cluster "' + args.newName + '" already exists!');
  }

  clusters[args.newName] = clusters[args.name];
  delete clusters[args.name];

  utils.saveClusters(clusters, function () {
    utils.success('Cluster "' + args.name + '" has been renamed to "' + args.newName + '".');
    list.run(args);
  });
};

subcommands.rename.help = function () {
  utils.printArray([
    'overcast cluster rename [name] [new-name]',
    '  Renames a cluster.'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast cluster rename app-cluster app-cluster-renamed'.grey
  ]);
};

subcommands.remove = function (args) {
  var clusters = utils.getClusters();

  if (!args.name) {
    return utils.missingParameter('[name]', subcommands.remove.help);
  } else if (!clusters[args.name]) {
    return utils.die('The cluster "' + args.name + '" wasn\'t found.');
  }

  var orphaned = 0;
  if (!_.isEmpty(clusters[args.name].instances)) {
    orphaned = _.keys(clusters[args.name].instances).length;
    clusters.orphaned = clusters.orphaned || { instances: {} };
    _.extend(clusters.orphaned.instances, clusters[args.name].instances);
  }

  delete clusters[args.name];

  utils.saveClusters(clusters, function () {
    utils.success('Cluster "' + args.name + '" has been removed.');
    if (orphaned) {
      if (args.name === 'orphaned') {
        utils.alert('The ' + orphaned + ' instance(s) in the "orphaned" cluster were removed.');
      } else {
        utils.alert('The ' + orphaned + ' instance(s) from this cluster were moved to the "orphaned" cluster.');
      }
    }
    list.run(args);
  });
};

subcommands.remove.help = function () {
  utils.printArray([
    'overcast cluster remove [name]',
    '  Removes a cluster from the index. If the cluster has any instances'.grey,
    '  attached to it, they will be moved to the "orphaned" cluster.'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast cluster remove db'.grey
  ]);
};

exports.signatures = function () {
  return [
    '  overcast cluster list',
    '  overcast cluster count [name]',
    '  overcast cluster create [name]',
    '  overcast cluster rename [name] [new-name]',
    '  overcast cluster remove [name]'
  ];
};

exports.help = function () {
  utils.printCommandHelp(subcommands);
};
