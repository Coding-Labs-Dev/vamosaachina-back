const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const cookieOptions = {
  httpOnly: true,
  maxAge: 3600000,
  // secure: true,
};

module.exports = {
  async verify(req, res) {
    if (!req.cookies || !req.cookies.accessToken) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    if (!req.headers.authorization) {
      return res
        .status(401)
        .clearCookie('accessToken', { ...cookieOptions, maxAge: null })
        .clearCookie('refreshToken', { ...cookieOptions, maxAge: null })
        .json({ msg: 'Invalid token' });
    }
    const { accessToken } = req.cookies;
    const verificationToken = req.headers.authorization.split(' ')[1];

    try {
      const rsa = await fs.readFileSync(`pk-${process.env.RSAKEY}.pem`, 'utf8');
      const decoded = jwt.verify(accessToken, rsa, {
        algorithms: ['RS256'],
      });
      if (!decoded) {
        return res.status(400).json({ msg: 'Invalid token' });
      }

      return bcrypt.compare(decoded.sub, verificationToken, (err, result) => {
        if (err) {
          return res.status(500).json({ isAuth: false, msg: err });
        }
        if (result) {
          return res.status(200).json({ isAuth: true });
        }
        return res
          .status(401)
          .clearCookie('accessToken', { ...cookieOptions, maxAge: null })
          .clearCookie('refreshToken', { ...cookieOptions, maxAge: null })
          .json({ msg: 'Invalid token' });
      });
    } catch (err) {
      return res.status(401).json({ msg: err.message });
    }
  },
  async store(req, res) {
    try {
      const {
        body: { username, password, saveSession },
      } = req;

      const user = await User.queryOne({ username }).exec();

      if (!user) {
        return res.status(401).json({ isAuth: false, msg: 'User not found' });
      }

      return bcrypt.compare(password, user.password, async (err, result) => {
        if (err) {
          return res.status(500).json({ isAuth: false, msg: err });
        }
        if (result) {
          const {
            accessToken,
            refreshToken,
            verificationToken,
          } = await user.generateAuthToken(user, true);

          const authOptions = cookieOptions;
          const refreshOptions = {
            ...cookieOptions,
            maxAge: 1 * 365 * 24 * 60 * 60 * 1000,
          };
          if (!saveSession) {
            delete authOptions.maxAge;
            delete refreshOptions.maxAge;
          }

          return res
            .status(201)
            .cookie('accessToken', accessToken, authOptions)
            .cookie('refreshToken', refreshToken, refreshOptions)
            .send({
              isAuth: true,
              role: user.role,
              verificationToken,
            });
        }
        return res.status(401).json({ isAuth: false, msg: 'Invalid password' });
      });
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
  async refresh(req, res) {
    if (!req.cookies || !req.cookies.refreshToken) {
      return res
        .status(401)
        .json({ msg: 'Access denied. No refresh token provided.' });
    }
    // get the token from the header if present
    const { refreshToken } = req.cookies;

    try {
      // get keyPrefix
      const rsa = await fs.readFileSync(`pk-${process.env.RSAKEY}.pem`, 'utf8');
      // if can verify the token, set req.user and pass to next middleware
      const decoded = jwt.verify(refreshToken, rsa, {
        algorithms: ['RS256'],
      });
      if (!decoded) {
        return res.status(400).json({ msg: 'Invalid token' });
      }

      const { sub: id } = decoded;

      const user = await User.queryOne({ id }).exec();

      if (!user) {
        return res.status(400).json({ msg: 'User not found' });
      }

      const { refreshTokens } = user;
      if (!refreshTokens || !refreshTokens.includes(refreshToken)) {
        return res.status(401).json({ msg: 'No valid refresh tokens found' });
      }

      const { accessToken, verificationToken } = await user.generateAuthToken(
        user
      );
      return res
        .status(201)
        .cookie('accessToken', accessToken, cookieOptions)
        .json({
          isAuth: true,
          verificationToken,
        });
    } catch (err) {
      // if invalid token
      return res.status(401).json({ msg: err.message });
    }
  },
  async destroy(req, res) {
    return res
      .status(200)
      .clearCookie('accessToken', { ...cookieOptions, maxAge: null })
      .clearCookie('refreshToken', { ...cookieOptions, maxAge: null })
      .send();
  },
};
