class TestController {
  test = async (req, res, next) => {
    return res.status(201).json({ success: true, message: "Conexão aceita" });
  };
}

export default new TestController();
