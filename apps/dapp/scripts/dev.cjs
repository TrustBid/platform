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

async function killProcessOnPort(port) {
  if (process.platform === 'win32') {
    await runCommand('powershell', [
      '-NoProfile',
      '-Command',
      `$connection = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1; if ($connection) { Stop-Process -Id $connection.OwningProcess -Force }`,
    ]);
    return;
  }

  const { stdout } = await runCommand('lsof', ['-ti', `tcp:${port}`]);
  const pids = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pid of pids) {
    if (pid === String(process.pid)) {
      continue;
    }

    await runCommand('kill', ['-9', pid]);
  }
}

async function main() {
  await killProcessOnPort(3000);

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
