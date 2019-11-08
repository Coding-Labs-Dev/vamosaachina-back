const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = {
  async store(req, res) {
    try {
      const {
        body: { username, password: rawPassword },
      } = req;

      const userExists = await User.queryOne({ username }).exec();

      if (userExists) {
        return res
          .status(401)
          .json({ status: false, msg: 'Username already exists' });
      }

      const password = await bcrypt.hash(rawPassword, 10);
      const user = await User.create({ username, password });
      return res.status(201).json({ user });
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};
