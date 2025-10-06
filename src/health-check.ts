import * as http from 'http';

/**
 * Health check script for Docker HEALTHCHECK
 * Makes a simple HTTP request to the /health endpoint
 * Exits with 0 on success, 1 on failure
 */
async function checkHealth(): Promise<void> {
  const options = {
    hostname: 'localhost',
    port: 3030,
    path: '/health',
    method: 'GET',
    timeout: 3000,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      if (res.statusCode === 200) {
        // eslint-disable-next-line no-console
        console.log('Health check passed');
        resolve();
      } else {
        // eslint-disable-next-line no-console
        console.error(`Health check failed with status: ${res.statusCode}`);
        reject(new Error(`Health check failed with status: ${res.statusCode}`));
      }
    });

    req.on('error', error => {
      // eslint-disable-next-line no-console
      console.error('Health check error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      // eslint-disable-next-line no-console
      console.error('Health check timeout');
      reject(new Error('Health check timeout'));
    });

    req.end();
  });
}

// Run health check
if (require.main === module) {
  checkHealth()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
