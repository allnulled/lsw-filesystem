const { resolve } = require(__dirname + "/bundler.utils.js");

module.exports = [
  __dirname + "/ufs.forked.js",
  __dirname + "/../lsw-database/browsie.unbundled.js",
  __dirname + "/lsw-filesystem.unbundled.js",
]