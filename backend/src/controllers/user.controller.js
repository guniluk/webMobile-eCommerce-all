export const signup = async (req, res) => {
  try {
    res.status(200).json({ message: "signup" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
