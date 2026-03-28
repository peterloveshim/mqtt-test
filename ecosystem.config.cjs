module.exports = {
  apps: [
    {
      name: 'mqtt-broker',
      script: 'src/broker.js',
      cwd: '/home/onlyhisson/www/mqtt-test',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'mqtt-publisher',
      script: 'src/publisher.js',
      cwd: '/home/onlyhisson/www/mqtt-test',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
