const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const cookieOptions = {
  httpOnly: true,
  maxAge: 3600000,
  // secure: true,
};

module.exports = async (req, res, next) => {
  if (!req.cookies || !req.cookies.accessToken || !req.headers.authorization) {
    return res.status(401).json({ msg: 'Access denied. No token provided.' });
  }
  // get the token from the header if present
  const token = req.cookies.accessToken;
  const verificationToken = req.headers.authorization.split(' ')[1];

  try {
    // get keyPrefix
    const rsa = await fs.readFileSync(
      path.join(__dirname, '..', '..', `pk-${process.env.RSAKEY}.pem`),
      'utf8'
    );
    // if can verify the token, set req.user and pass to next middleware
    const decoded = jwt.verify(token, rsa, {
      algorithms: ['HS256'],
    });

    return bcrypt.compare(decoded.sub, verificationToken, (err, result) => {
      if (err) {
        return res.status(500).json({ isAuth: false, msg: err });
      }
      if (result) {
        req.user = {
          id: decoded.sub,
        };

        return next();
      }
      return res
        .status(401)
        .clearCookie('accessToken', { ...cookieOptions, maxAge: null })
        .clearCookie('refreshToken', { ...cookieOptions, maxAge: null })
        .json({ msg: 'Invalid token' });
    });
  } catch (err) {
    console.log(err);
    // if invalid token
    return res.status(401).json({ msg: err.message });
  }
};
