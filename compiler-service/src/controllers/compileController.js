import { compileCpp } from "../services/compilerService.js";

export const compileCode = async (req, res) => {
  const { language, code, stdin = " " } = req.body;

  if (!language) {
    return res.status(400).json({
      error: "Language is required",
    });
  }

  if (!code || !code.trim()) {
    return res.status(400).json({
      error: "Code is required",
    });
  }

  if (language !== "cpp") {
    return res.status(400).json({
      error: "Only C++ is supported",
    });
  }

  const result = await compileCpp(code, stdin);

  if (!result.success) {
    return res.status(200).json({
      success: false,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  }

  return res.status(200).json({
    success: true,
    stdout: result.stdout,
    stderr: result.stderr,
  });
};
