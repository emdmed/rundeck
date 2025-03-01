// File: app/api/tcp-ports/route.js

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function extractUsedPorts(portsStr, platform) {
    const ports = [];
    const lines = portsStr.split(/\r?\n/);
  
    if (platform === 'win32') {
      // Windows: netstat -ano output
      // Look for lines starting with "TCP" and extract the local port.
      for (const line of lines) {
        if (!line.trim().startsWith('TCP')) continue;
        const tokens = line.trim().split(/\s+/);
        // tokens[1] is the Local Address (e.g., "0.0.0.0:80")
        if (tokens.length < 2) continue;
        const localAddress = tokens[1];
        const parts = localAddress.split(':');
        const portStr = parts[parts.length - 1];
        const port = Number(portStr);
        if (!isNaN(port)) {
          ports.push(port);
        }
      }
    } else if (platform === 'linux') {
      // Ubuntu: netstat -tuln output
      // Lines usually start with "tcp" or "tcp6". The Local Address is typically in the fourth column.
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('tcp') && !trimmed.startsWith('tcp6')) continue;
        const tokens = trimmed.split(/\s+/);
        if (tokens.length < 4) continue;
        const localAddress = tokens[3];
        // Use a regex to capture the port at the end of the local address
        const match = localAddress.match(/:(\d+)$/);
        if (match) {
          ports.push(Number(match[1]));
        }
      }
    } else if (platform === 'darwin') {
      // macOS/iOS (using lsof -nP -iTCP -sTCP:LISTEN output)
      // Skip header lines and process only lines containing "(LISTEN)"
      for (const line of lines) {
        if (!line.includes('(LISTEN)')) continue;
        // Try matching the pattern, e.g., "*:3000 (LISTEN)"
        const match = line.match(/:(\d+)\s+\(LISTEN\)/);
        if (match) {
          ports.push(Number(match[1]));
        } else {
          // Fallback: try a general pattern to extract a port number
          const matchGeneral = line.match(/:(\d+)\b/);
          if (matchGeneral) {
            ports.push(Number(matchGeneral[1]));
          }
        }
      }
    } else {
      throw new Error('Unsupported platform');
    }
  
    return ports;
  }
  

export async function GET() {
  const platform = process.platform;
  let command = '';

  if (platform === 'win32') {
    // Windows: List all TCP connections with process IDs.
    command = 'netstat -ano';
  } else if (platform === 'linux') {
    // Ubuntu/Linux: List TCP ports in use.
    command = 'netstat -tuln';
  } else if (platform === 'darwin') {
    // macOS: List listening TCP ports.
    command = 'lsof -nP -iTCP -sTCP:LISTEN';
  } else {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    const formattedStdout = extractUsedPorts(stdout, platform)

    return NextResponse.json({ ports: formattedStdout });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
