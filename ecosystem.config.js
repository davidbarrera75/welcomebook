module.exports = {
  apps: [{
    name: 'welcomebook',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002',
    cwd: '/var/www/welcomebook/nextjs_space',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/welcomebook/error.log',
    out_file: '/var/log/welcomebook/out.log',
    log_file: '/var/log/welcomebook/combined.log',
    time: true
  }]
};
