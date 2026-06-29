const { spawn } = require('node:child_process');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

async function killExistingNextDevProcesses() {
  if (process.platform === 'win32') {
    await runCommand('powershell', [
      '-NoProfile',
      '-Command',
      `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'next dev' -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`,
    ]);
  } else {
    await runCommand('pkill', ['-f', 'next dev']);
  }
}

async function main() {
  await killExistingNextDevProcesses();

  const nextBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(nextBin, ['next', 'dev', '--hostname', '0.0.0.0', '--port', '3000'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('No se pudo iniciar Next.js:', error);
  process.exit(1);
});
