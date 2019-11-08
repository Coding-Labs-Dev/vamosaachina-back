import Client from '../models/Client';

module.exports = {
  async index(req, res) {
    const clients = await Client.scan().exec();
    return res.status(200).json({ clients });
  },

  async show(req, res) {
    const { id } = req.params;
    const client = await Client.get({ id });
    if (!client) {
      return res.status(404).json({ msg: `Client doesn't exists` });
    }
    return res.status(200).json({ client });
  },
};
