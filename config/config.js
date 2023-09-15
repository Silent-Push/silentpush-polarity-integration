module.exports = {
    name: 'Silent Push',
    acronym: 'SP',
    description: 'Enrich alerts with Whois, Risk Scores, and much more context from Silent Push Threat Intelligence',
    defaultColor: 'dark-blue-gray',
    entityTypes: ['IPv4', 'IPv6', 'domain', 'url'],
    styles: ['./styles/main.css'],
    options: [
        {
          key: 'apiKey',
          name: 'API Key',
          description: "If you don't have an api key yet, sign up on https://explore.silentpush.com/register",
          default: '',
          type: 'password',
          userCanEdit: true,
          adminOnly: true
        },
    ]
};