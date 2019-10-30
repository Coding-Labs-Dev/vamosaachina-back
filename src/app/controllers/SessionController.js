import PagSeguro from '@luismramirezr/pagseguro';

const {
  EMAIL: email,
  TOKEN: token,
  SANDBOX: sandbox,
  SANBOX_EMAIL: sandboxEmail,
} = process.env;

const Payment = new PagSeguro({
  email,
  token,
  sandbox: sandbox !== 'false',
  sandboxEmail,
});

class SessionController {
  async create(req, res) {
    try {
      const response = await Payment.getSession();
      if (response.status) {
        const { id } = response.response.session;
        res.json({ status: true, id });
        return;
      }
      throw new Error(response);
    } catch (error) {
      res.status(500).json({ status: false, error });
    }
  }
}

export default new SessionController();
