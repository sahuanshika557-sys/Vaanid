import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function runPythonDbApi(args: string[]): Record<string, unknown> {
  const rootDir = process.cwd();
  let backendDir = path.resolve(rootDir, 'backend');
  if (!fs.existsSync(backendDir)) {
    backendDir = path.resolve(rootDir, '../backend');
  }

  const dbApiScript = path.resolve(backendDir, 'src/database/db_api.py');

  const winVenvPython = path.resolve(backendDir, '.venv/Scripts/python.exe');
  const nixVenvPython = path.resolve(backendDir, '.venv/bin/python');

  let pythonCmd = 'python';
  if (fs.existsSync(winVenvPython)) {
    pythonCmd = winVenvPython;
  } else if (fs.existsSync(nixVenvPython)) {
    pythonCmd = nixVenvPython;
  }

  try {
    const output = execFileSync(pythonCmd, [dbApiScript, ...args], {
      cwd: backendDir,
      encoding: 'utf-8',
      timeout: 10000,
    });
    return JSON.parse(output.trim());
  } catch (err: unknown) {
    try {
      const output = execFileSync('uv', ['run', 'python', dbApiScript, ...args], {
        cwd: backendDir,
        encoding: 'utf-8',
        timeout: 10000,
      });
      return JSON.parse(output.trim());
    } catch (fallbackErr: unknown) {
      console.error('[DB API Bridge Error]:', err, fallbackErr);
      throw new Error('Could not execute Python DB bridge');
    }
  }
}
