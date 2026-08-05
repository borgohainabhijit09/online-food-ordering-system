const fs = require('fs');
const { Client } = require('ssh2');

const pubKey = fs.readFileSync(require('os').homedir() + '/.ssh/id_ed25519.pub', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`mkdir -p ~/.ssh && echo "${pubKey.trim()}" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '95.111.229.39',
  port: 22,
  username: 'root',
  password: 'QCgLZ98on7WeQM4cHLae'
});
