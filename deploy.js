const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
    console.log('🚀 Starting Raspberry Pi Deployment...');
    console.log('📂 Current directory:', __dirname);
    
    // Read the .env file
    const envPath = path.join(__dirname, '.env');
    console.log('📁 Env file path:', envPath);

    if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
    }

    const env = fs.readFileSync(envPath, 'utf8');

    // Parse environment variables
    const envVars = {};
    env.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    // Debug: Show parsed environment variables
    console.log('🔑 Parsed environment variables:', envVars);

    // Merge environment variables with process.env
    const execEnv = {
        ...process.env,
        ...envVars
    };

    try {
        // Create temp file in the current directory
        const tempFileName = 'temp_env.sh';
        const tempFilePath = path.join(__dirname, tempFileName);
        console.log('📄 Creating temp file at:', tempFilePath);

        // Write environment variables with Unix line endings
        const envContent = Object.entries(envVars)
            .map(([key, value]) => `export ${key}='${value.replace(/'/g, `'\\''`)}'`)
            .join('\n');
        fs.writeFileSync(tempFilePath, envContent.replace(/\r\n/g, '\n'));
        console.log('✍️  Temp file written successfully at:', tempFilePath);

        // Convert and escape Windows path for WSL
        const wslPath = __dirname
            .replace(/^([A-Za-z]):/, (_, letter) => `/mnt/${letter.toLowerCase()}`)
            .replace(/\\/g, '/')
            .replace(/ /g, '\\ '); // Escape spaces
        console.log('🐧 WSL working directory:', wslPath);

        // Build command with proper escaping
        const wslCommand = [
            'cd', `"${wslPath}"`,
            '&&', 'source', tempFileName,
            '&&', 'ansible-playbook', '-i', 'hosts', 'playbook.yaml'
        ].join(' ');
        
        const command = `wsl -d Ubuntu /bin/bash -c "${wslCommand}"`;
        console.log('🔧 Executing command:', command);

        execSync(command, { 
            stdio: 'inherit',
            env: execEnv,
            shell: true
        });

        console.log('🎉 Raspberry Pi Deployment completed successfully!');
    } finally {
        // Cleanup
        const tempFilePath = path.join(__dirname, 'temp_env.sh');
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log('🧹 Temp file cleaned up');
        }
    }
    
} catch (error) {
    console.error('❌ Raspberry Pi Deployment failed');
    console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        path: error.path,
        command: error.cmd,
        status: error.status
    });
    process.exit(1);
}
