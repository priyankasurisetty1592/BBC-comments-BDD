// Configuration file with test credentials
module.exports = {
  testUser: {
    email: 'priyanka.surisetty15@gmail.com',
    password: 'Prisuris@12345'
  },
  baseUrl: 'https://www.test.bbc.co.uk/sport/articles/cj2ne09x2j0o?mode=testData',
  testData: {
    comment: `This is an automated comment for testing ${Math.floor(Math.random() * 900) + 100}`,
    reply: 'This is an automated reply for testing'
  }
};
