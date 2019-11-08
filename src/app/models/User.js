const fs = require('fs');
const dynamoose = require('dynamoose');
const EDID = require('edid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'dev') {
  dynamoose.local();
}

const edid = new EDID();

const { Schema } = dynamoose;

const schemaName = 'users';

const { DATABASE, RSAKEY } = process.env;

const schema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
      required: true,
      default: () => {
        let id;
        edid.generate((err, uid) => {
          id = uid;
        });
        return id;
      },
    },
    username: {
      type: String,
      required: true,
      index: {
        name: 'authentication',
        rangeKey: 'password',
        global: true,
      },
    },
    password: {
      type: String,
      required: true,
    },
    refreshTokens: {
      type: 'list',
      list: [String],
    },
  },
  {
    timestamps: true,
  }
);

schema.methods.refreshToken = async (user, rsa) => {
  const refreshToken = jwt.sign({ sub: user.id, type: 'refreshToken' }, rsa, {
    algorithm: 'RS256',
  });

  const { refreshTokens = [] } = await user
    .model(`${DATABASE}-${schemaName}`)
    .get({ id: user.id });

  refreshTokens.unshift(refreshToken);
  refreshTokens.splice(50);

  await user
    .model(`${DATABASE}-${schemaName}`)
    .update({ id: user.id, refreshTokens });

  return refreshToken;
};

schema.methods.generateAuthToken = async (
  user,
  generateRefreshToken = false,
  expiresIn = 3600
) => {
  const { id } = user;
  const rsa = await fs.readFileSync(`pk-${RSAKEY}.pem`, 'utf8');
  const accessToken = jwt.sign({ sub: id, type: 'accessToken' }, rsa, {
    algorithm: 'RS256',
    expiresIn,
  });

  const verificationToken = await bcrypt.hash(`${id}`, 10);

  if (generateRefreshToken) {
    const refreshToken = await user.refreshToken(user, rsa);

    return { accessToken, refreshToken, verificationToken };
  }
  return { accessToken, verificationToken };
};

const Model = dynamoose.model(`${DATABASE}-${schemaName}`, schema, {
  update: true,
});

module.exports = Model;
