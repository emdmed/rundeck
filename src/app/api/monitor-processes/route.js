import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

async function getTerminalsAndCommands() {
    try {
        if (os.platform() === "win32") {
            const { stdout } = await execAsync(
                `powershell -Command "Get-WmiObject Win32_Process | Select-Object ProcessId,CommandLine,ExecutablePath | ConvertTo-Json"`
            );

            const processes = JSON.parse(stdout);

            const processList = Array.isArray(processes) ? processes : [processes];

            return processList
                .filter(proc => proc.ExecutablePath) // Ensure valid paths
                .map(proc => ({
                    pid: proc.ProcessId,
                    command: proc.CommandLine || "Unknown",
                    path: proc.ExecutablePath, // Absolute path to the executable
                    cwd: "Unknown (Windows does not expose cwd easily)",
                }));
        } else {
            const { stdout: ptsProcesses } = await execAsync(`ps aux | grep pts/ | grep -v grep`);

            if (!ptsProcesses.trim()) {
                console.log("No active terminals found.");
                return [];
            }

            const terminalInfo = await Promise.all(
                ptsProcesses.split("\n").map(async (line) => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length > 10) {
                        const pid = parts[1];
                        const tty = parts[6];
                        const command = parts.slice(10).join(" ");

                        try {
                            const { stdout: cwd } = await execAsync(`readlink /proc/${pid}/cwd`);
                            return { pid, tty, command, cwd: cwd.trim(), path: cwd.trim() };
                        } catch (error) {
                            console.log(error);
                            return { pid, tty, command, cwd: "Unknown (Permission Denied or Process Ended)", path: "Unknown" };
                        }
                    }
                    return null;
                })
            );

            return terminalInfo.filter(Boolean);
        }
    } catch (error) {
        console.error("Error fetching terminal details:", error.message);
        return [];
    }
}

export async function GET() {
    try {
        const activeTerminals = await getTerminalsAndCommands();

        return NextResponse.json({
            terminals: activeTerminals.filter(terminal => terminal.path !== "Unknown"),
        });
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
