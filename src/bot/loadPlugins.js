const fs = require('fs-extra');
const path = require('path');

const DEFAULT_PLUGINS_DIR = path.join(__dirname, 'defaultPlugins');
const PLUGINS_DIR = path.join(__dirname, 'plugins');

module.exports = () => {
  return Promise.all([fs.readdir(DEFAULT_PLUGINS_DIR), fs.readdir(PLUGINS_DIR)])
    .then(files => {
      const plugins = [];

      function addPlugin(plugin, isDefault) {
        try {
          plugin = require(plugin);
        } catch(e) { console.error(`Error loading${isDefault ? ' default' : ''} plugin ${path.basename(plugin)}`, e); }

        if (isDefault) plugin.default = true;
        plugins.push(plugin);
      }

      files[0].forEach(file => addPlugin(path.join(DEFAULT_PLUGINS_DIR, file), true));
      files[1].forEach(file => addPlugin(path.join(PLUGINS_DIR, file)));

      return plugins;
    });
};