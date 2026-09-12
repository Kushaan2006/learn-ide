export const compileRequestController = async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.COMPILER_SERVICE_URL}/api/compile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COMPILER_SERVICE_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      },
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Compiler service unreachable",
    });
  }
};
