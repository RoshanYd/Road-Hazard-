// Root entrypoint fallback for cloud platforms (e.g. Render) deploying from repo root
const path = require('path');
process.chdir(path.join(__dirname, 'backend'));
require('./backend/server.js');
