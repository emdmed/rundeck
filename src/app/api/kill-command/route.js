import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getTerminalsAndCommands() {
    try {

        const { stdout: terminalProcesses } = await execAsync(
            `ps aux | grep -E 'gnome-terminal|konsole|xterm|mate-terminal|xfce4-terminal' | grep -v grep`
        );

        if (!terminalProcesses.trim()) {
            console.log("No active terminals found.");
            return [];
        }

        const { stdout: ptsProcesses } = await execAsync(
            `ps aux | grep pts/ | grep -v grep`
        );


        const terminalInfo = await Promise.all(
            ptsProcesses.split("\n").map(async (line) => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 10) {
                    const pid = parts[1];  
                    const tty = parts[6];  
                    const command = parts.slice(10).join(" ");

                    try {
                        const { stdout: cwd } = await execAsync(`readlink /proc/${pid}/cwd`);
                        return { pid, tty, command, cwd: cwd.trim() };
                    } catch (error) {
                        console.log(error)
                        return { pid, tty, command, cwd: "Unknown (Permission Denied or Process Ended)" };
                    }
                }
                return null;
            })
        );

        return terminalInfo.filter(Boolean);
    } catch (error) {
        console.error("Error fetching terminal details:", error.message);
        return [];
    }
}

export async function POST(req) {
    try {
        const { path } = await req.json();

        if (!path) {
            return NextResponse.json({ error: "Path is required" }, { status: 400 });
        }

        try {
            const activeTerminals = await getTerminalsAndCommands()
            const terminalToKill = activeTerminals.find(terminal => terminal.cwd === path)
            await execAsync(`kill -9 ${terminalToKill.pid} || true`);
        } catch (err) {
            console.log(err)
            return NextResponse.json({ error: `Failed to close terminal: ${err.message}` }, { status: 500 });
        }

        return NextResponse.json({
            message: `Terminated successfully`
        });
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
