import PagSeguro from '@luismramirezr/pagseguro';

import Client from '../models/Client';
import Transaction from '../models/Transaction';

const {
  EMAIL: email,
  TOKEN: token,
  SANDBOX: sandbox,
  SANDBOX_EMAIL: sandboxEmail,
} = process.env;

class TransactionController {
  async index(req, res) {
    const transactions = await Transaction.scan().exec();
    return res.status(200).json({ transactions });
  }

  async store(req, res) {
    const Payment = new PagSeguro({
      email,
      token,
      sandbox: sandbox !== 'false',
      sandboxEmail,
    });
    try {
      const {
        body: {
          cart,
          sender,
          shipping,
          billing,
          paymentMethod,
          creditCard,
          creditCardHolder,
        },
      } = req;

      const payment = {
        method: paymentMethod,
      };

      if (paymentMethod === 'creditCard') {
        payment.params = [
          { card: creditCard },
          { ...creditCardHolder },
          { ...billing, sameAsShipping: creditCardHolder.sameAsBuyer },
          {
            installmentQuantity: cart.creditCard
              ? cart.creditCard.quantity
              : null,
            installmentValue: cart.creditCard
              ? cart.creditCard.installmentAmount
              : null,
            noInterestInstallmentQuantity: cart.creditCard
              ? cart.maxInstallmentNoInterest
              : null,
          },
        ];
      }

      Payment.setCheckoutData(sender, shipping, cart.items, payment);
      const options = {
        reference: '51-Vamos-a-China',
        notificationURL: process.env.NOTIFICATION_URL,
      };
      if (paymentMethod === 'bankTicket') {
        options.extraAmount = -1;
      }

      const rawDOB = sender.senderBirthDate.split('/');
      const dob = new Date(Number(rawDOB[2]), Number(rawDOB[1]) - 1, rawDOB[0]);

      const clientExists = await Client.queryOne({
        email: sender.senderEmail,
      }).exec();

      const client =
        clientExists ||
        (await Client.create({
          name: sender.senderName,
          email: sender.senderEmail,
          phone: sender.senderFullPhone,
          cpf: sender.senderCPF,
          dob,
          street: shipping.shippingAddressStreet,
          complement: shipping.shippingAddressComplement,
          number: shipping.shippingAddressNumber,
          district: shipping.shippingAddressDistrict,
          city: shipping.shippingAddressCity,
          state: shipping.shippingAddressState,
          postalCode: shipping.shippingAddressPostalCode,
        }));

      const response = await Payment.makePayment(options);
      if (response.status) {
        const {
          code,
          status: transactionStatus,
          paymentLink,
          date,
          grossAmount,
          feeAmount,
          netAmount,
          extraAmount,
          installmentAmount,
        } = response.response.transaction;
        const { transactions = [] } = client;
        transactions.push(code);
        client.transactions = transactions;
        await client.save();

        await Transaction.create({
          code,
          client: client.id,
          reference: '51-Vamos-a-China',
          status: [
            'Aguardando',
            'Em análise',
            'Paga',
            'Disponível',
            'Em disputa',
            'Devolvida',
            'Cancelada',
          ][transactionStatus - 1],
          data: new Date(date),
          paymentMethod,
          paymentLink,
          grossAmount,
          feeAmount,
          netAmount,
          extraAmount,
          installmentAmount,
          history: [
            {
              status: [
                'Aguardando',
                'Em análise',
                'Paga',
                'Disponível',
                'Em disputa',
                'Devolvida',
                'Cancelada',
              ][transactionStatus - 1],
              date: new Date(date),
            },
          ],
        });

        return res.json({
          status: true,
          transactionStatus,
          paymentLink,
        });
      }
      throw response;
    } catch (error) {
      return res.status(500).json({ status: false, error });
    }
  }

  async show(req, res) {
    const { id } = req.params;
    const transaction = await Transaction.get({ id });
    if (!transaction) {
      return res.status(404).json({ msg: `Transaction doesn't exists` });
    }
    return res.status(200).json({ transaction });
  }
}

export default new TransactionController();
