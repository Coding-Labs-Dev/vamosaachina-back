import dynamoose from 'dynamoose';
import EDID from 'edid';

if (process.env.NODE_ENV === 'dev') {
  dynamoose.local();
}

const edid = new EDID();

const { Schema } = dynamoose;

const schemaName = 'transactions';

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
    code: {
      type: String,
      required: true,
      index: {
        name: 'transaction-code',
        global: true,
      },
    },
    client: { type: String, required: true },
    reference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'Aguardando',
        'Em análise',
        'Paga',
        'Disponível',
        'Em disputa',
        'Devolvida',
        'Cancelada',
      ],
    },
    data: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['creditCard', 'bankTicket'],
    },
    paymentLink: String,
    grossAmount: Number,
    feeAmount: Number,
    netAmount: Number,
    extraAmount: Number,
    installmentCount: Number,
    history: {
      type: 'list',
      list: [
        {
          type: 'map',
          map: {
            status: String,
            date: Date,
          },
        },
      ],
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
