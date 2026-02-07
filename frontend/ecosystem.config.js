module.exports = {
  apps: [{
    name: '8pm-frontend',
    script: 'npm',
    args: 'start -- -p 3001',
    cwd: '/var/www/eightpm/frontend',
    env: {
      NODE_ENV: 'production',
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    },
    // Restart settings
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    // Logging
    error_file: '/home/ec2-user/.pm2/logs/8pm-frontend-error.log',
    out_file: '/home/ec2-user/.pm2/logs/8pm-frontend-out.log',
    merge_logs: true,
    // Don't watch files (we restart manually after builds)
    watch: false
  }]
};
