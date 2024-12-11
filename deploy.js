const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

try {
    const command = 'ansible-playbook playbook.yaml -i hosts';

    console.log('Starting deployment...');
    execSync(command, { stdio: 'inherit', shell: true });
    console.log('Deployment completed successfully!');
} catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
}
