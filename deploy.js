const { exec } = require('child_process');
const path = require('path');

// Get the absolute path to ansible-playbook in the virtual environment
const ansiblePath = path.resolve(__dirname, 'ansible-env', 'Scripts', 'ansible-playbook.exe');

// Set environment variables
const env = {
    ...process.env,
    ANSIBLE_PYTHON_INTERPRETER: path.resolve(__dirname, 'ansible-env', 'Scripts', 'python.exe'),
};

// Execute ansible-playbook with proper configuration
exec(`"${ansiblePath}" -i hosts playbook.yaml`, 
    { env },
    (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        if (error) {
            console.error(`Error: ${error}`);
            process.exit(1);
        }
    }
);

