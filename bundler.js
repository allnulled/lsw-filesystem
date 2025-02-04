const fs = require("fs");
const { resolve } = require(__dirname + "/bundler.utils.js");


// 2. Bundle js:
require(resolve("dev/bundlers/core/htmlbundler.js")).bundle({
  list: __dirname + "/bundlelist.js.js",
  module: true,
  id: "Lsw_filesystem_js",
  output: __dirname + "/lsw-filesystem.bundled.js",
  ignore: [],
  wrap: false,
});

Set_license: {
  const package = require(__dirname + "/package.json");
  const prependFileSync = (file, text, encode = "utf8") => fs.writeFileSync(file, text + fs.readFileSync(file).toString(), "utf8");
  const licenseSource = fs.readFileSync(__dirname + "/LICENSE.md").toString();
  prependFileSync(__dirname + "/lsw-filesystem.bundled.js", licenseSource, "utf8");
}