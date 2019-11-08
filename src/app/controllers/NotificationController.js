import PagSeguro from '@luismramirezr/pagseguro';

import Transaction from '../models/Transaction';
import Client from '../models/Client';

const {
  EMAIL: email,
  TOKEN: token,
  SANDBOX: sandbox,
  SANDBOX_EMAIL: sandboxEmail,
} = process.env;

class NotificationController {
  async store(req, res) {
    const { notificationCode } = req.body;
    const Payment = new PagSeguro({
      email,
      token,
      sandbox: sandbox !== 'false',
      sandboxEmail,
    });
    try {
      const response = await Payment.getTarnsactionFromNotification(
        notificationCode
      );
      if (response.status) {
        const {
          code,
          reference,
          status: transactionStatus,
          paymentLink,
          date,
          grossAmount,
          feeAmount,
          paymentMethod,
          netAmount,
          extraAmount,
          installmentAmount,
          sender,
          shipping,
        } = response.response.transaction;

        if (reference !== '51-Vamos-a-China') {
          return res.status(422).send('UNKNOWN REFERENCE');
        }

        const client =
          (await Client.queryOne({
            email: response.response.transaction.sender.email,
          }).exec()) ||
          (await Client.create({
            name: sender.name,
            email: sender.email,
            phone: `(${sender.phone.areaCode}) ${String(
              sender.phone.number
            ).substr(0, 5)}-${String(sender.phone.number).substr(5)}`,
            cpf: sender.documents.document.value,
            transactions: [code],
            street: shipping.address.street,
            complement: shipping.address.complement,
            number: shipping.address.number,
            district: shipping.address.district,
            city: shipping.address.city,
            state: shipping.address.state,
            postalCode: `${String(shipping.address.postalCode).substr(
              0,
              5
            )}-${String(shipping.address.postalCode).substr(5)}`,
          }));

        const transaction = await Transaction.queryOne({ code }).exec();

        if (!transaction) {
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
            paymentMethod: paymentMethod === 1 ? 'creditCard' : 'bankTicket',
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
        } else {
          transaction.status = [
            'Aguardando',
            'Em análise',
            'Paga',
            'Disponível',
            'Em disputa',
            'Devolvida',
            'Cancelada',
          ][transactionStatus - 1];
          transaction.history.unshift({
            status: transaction.status,
            date: new Date(date),
          });
          await transaction.save();
        }

        return res.status(200).send('OK');
      }
      throw new Error(response);
    } catch (error) {
      return res.status(500).json({ status: false, error });
    }
  }
}

export default new NotificationController();
