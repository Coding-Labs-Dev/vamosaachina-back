import PagSeguro from '@luismramirezr/pagseguro';

const {
  EMAIL: email,
  TOKEN: token,
  SANDBOX: sandbox,
  SANDBOX_EMAIL: sandboxEmail,
} = process.env;

class SessionController {
  async store(req, res) {
    const Payment = new PagSeguro({
      email,
      token,
      sandbox: sandbox !== 'false',
      sandboxEmail,
    });
    try {
      const response = await Payment.getSession();
      if (response.status) {
        const { id } = response.response.session;
        return res.json({ status: true, id });
      }
      throw new Error(response);
    } catch (error) {
      return res.status(500).json({ status: false, error });
    }
  }
}

export default new SessionController();
