module.exports = {
  apps: [
    {
      name: 'taichi-audit-website',
      script: 'npm',
      args: 'start',
      cwd: '/root/Taichi-site',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/taichi-audit-error.log',
      out_file: '/var/log/pm2/taichi-audit-out.log',
      log_file: '/var/log/pm2/taichi-audit-combined.log',
      time: true
    }
  ]
}; 