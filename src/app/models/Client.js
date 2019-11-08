const dynamoose = require('dynamoose');
const EDID = require('edid');

if (process.env.NODE_ENV === 'dev') {
  dynamoose.local();
}

const edid = new EDID();

const { Schema } = dynamoose;

const schemaName = 'clients';

const { DATABASE } = process.env;

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
    transactions: {
      type: 'list',
      list: [String],
    },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      index: {
        name: 'email',
        global: true,
      },
    },
    phone: { type: String, required: true },
    cpf: {
      type: String,
      required: true,
      set: value => {
        const regex = /[0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}/;
        if (!regex.test(value)) {
          const raw = value.replace(/\D/g, '');
          return `${raw.substr(0, 3)}.${raw.substr(3, 3)}.${raw.substr(
            6,
            3
          )}-${raw.substr(9)}`;
        }
        return value;
      },
    },
    dob: Date,
    street: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: {
      type: String,
      required: true,
      set: value => {
        const regex = /^[0-9]{5}-[0-9]{3}$/;
        if (!regex.test(value)) {
          const raw = value.replace(/\D/g, '');
          return `${raw.substr(0, 5)}-${raw.substr(5)}`;
        }
        return value;
      },
    },
  },
  {
    timestamps: true,
  }
);

const Model = dynamoose.model(`${DATABASE}-${schemaName}`, schema, {
  update: true,
});

module.exports = Model;
