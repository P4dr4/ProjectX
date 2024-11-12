const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

function isWSL() {
    try {
        const release = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
        return release.includes('microsoft') || release.includes('wsl');
    } catch {
        return false;
    }
}

function executeCommand(command, options = {}) {
    console.log('\n📋 Executing command:', command);
    const start = Date.now();
    const result = execSync(command, { ...options, encoding: 'utf8' });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Command completed in ${duration}s\n`);
    return result;
}

function deployWSL() {
    const currentPath = process.cwd();
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    const envVarsString = Object.entries(envConfig)
        .map(([key, value]) => `${key}='${value}'`)
        .join(' ');

    console.log('🐧 Deploying using WSL environment');
    return executeCommand(`${envVarsString} ansible-playbook -i hosts playbook.yaml`, {
        stdio: 'inherit',
        cwd: currentPath
    });
}

function deployWindows() {
    const currentPath = process.cwd().replace(/\\/g, '/').replace('C:', '/mnt/c');
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    const envVarsString = Object.entries(envConfig)
        .map(([key, value]) => `${key}='${value}'`)
        .join(' ');
    
    console.log('🪟 Deploying using Windows environment through WSL');
    const bashCommand = `cd "${currentPath}" && ${envVarsString} ansible-playbook -i hosts playbook.yaml`;
    return executeCommand(`wsl -d Ubuntu bash -c "${bashCommand.replace(/"/g, '\\"')}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
    });
}

function deploy() {
    try {
        console.log('🚀 Starting deployment process...');
        console.log('📁 Working directory:', process.cwd());
        
        // Load and validate environment
        const envConfig = dotenv.parse(fs.readFileSync('.env'));
        console.log('🔑 Loaded environment variables:', Object.keys(envConfig).join(', '));

        // Check for required files
        ['hosts', 'playbook.yaml'].forEach(file => {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file ${file} not found!`);
            }
        });

        // Execute deployment based on environment
        if (isWSL()) {
            deployWSL();
        } else {
            deployWindows();
        }

        console.log('\n✨ Deployment completed successfully!');
        console.log('📌 You can access your services at:');
        console.log(`   Frontend: http://[${envConfig.IPV6_ADDRESS}]:${envConfig.FRONTEND_PORT}`);
        console.log(`   Backend: http://[${envConfig.IPV6_ADDRESS}]:${envConfig.BACKEND_PORT}`);
    } catch (error) {
        console.error('\n❌ Deployment failed!');
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Execute deployment
deploy();
