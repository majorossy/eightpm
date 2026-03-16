const path = require('path');

module.exports = {
  apps: [{
    name: '8pm-frontend',
    script: 'npm',
    args: 'start',
    cwd: path.resolve(__dirname),
    env: {
      NODE_ENV: 'production',
    },
    // Restart settings
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    // Logging
    merge_logs: true,
    // Don't watch files (we restart manually after builds)
    watch: false
  }]
};
