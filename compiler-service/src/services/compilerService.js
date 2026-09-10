import { execFile } from "child_process";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const compileCpp = async (code, stdin = "") => {
  const executionId = crypto.randomUUID();

  const tempDirectory = path.join(os.tmpdir(), `learn-ide-${executionId}`);

  const sourceFilePath = path.join(tempDirectory, "main.cpp");

  const inputFilePath = path.join(tempDirectory, "input.txt");

  try {
    // 1. Create a unique temporary folder
    await fs.mkdir(tempDirectory, {
      recursive: true,
    });

    // 2. Write the student's code into main.cpp
    await fs.writeFile(sourceFilePath, code, "utf8");

    //2.2 Write input into input.txt
    await fs.writeFile(inputFilePath, stdin, "utf8");

    // 3. Docker arguments
    const dockerArguments = [
      "run",
      "--rm",

      // Security/resource restrictions
      "--network",
      "none",
      "--memory",
      "256m",
      "--cpus",
      "0.5",
      "--pids-limit",
      "64",

      // Mount temporary folder inside container
      "--mount",
      `type=bind,source=${tempDirectory},target=/app`,

      // Docker image
      "cpp-sandbox",

      // Fixed command executed inside the container
      "bash",
      "-lc",
      "g++ main.cpp -std=c++17 -o program && timeout 10s ./program < input.txt",
    ];

    const { stdout, stderr } = await execFileAsync("docker", dockerArguments, {
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });

    return {
      success: true,
      stdout,
      stderr,
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message,
      exitCode: error.code ?? null,
    };
  } finally {
    // 4. Always remove temporary files
    await fs.rm(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
};
