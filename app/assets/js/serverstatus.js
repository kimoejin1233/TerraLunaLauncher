import { connect } from 'net';

/**
 * Retrieves the status of a Minecraft server.
 *
 * @param {string} address The server address.
 * @param {number} port Optional. The port of the server. Defaults to 25565.
 * @returns {Promise.<Object>} A promise which resolves to an object containing
 * status information.
 */
export function getStatus(address = '118.220.140.108', port = 25565) {
    // Ensure port is a number
    port = typeof port === 'string' ? parseInt(port, 10) : port;

    return new Promise((resolve, reject) => {
        const socket = connect(port, address, () => {
            const buff = Buffer.from([0xFE, 0x01]);
            socket.write(buff);
        });

        socket.setTimeout(25000, () => {
            socket.end();
            reject({ code: 'ETIMEDOUT', errno: 'ETIMEDOUT', address, port });
        });

        socket.on('data', (data) => {
            if (data && data.length) {
                const serverInfo = data.toString().split('\x00\x00\x00');
                const NUM_FIELDS = 6;

                if (serverInfo.length >= NUM_FIELDS) {
                    resolve({
                        online: true,
                        version: serverInfo[2].replace(/\u0000/g, ''),
                        motd: serverInfo[3].replace(/\u0000/g, ''),
                        onlinePlayers: parseInt(serverInfo[4].replace(/\u0000/g, ''), 10),
                        maxPlayers: parseInt(serverInfo[5].replace(/\u0000/g, ''), 10),
                    });
                } else {
                    resolve({ online: false });
                }
            }
            socket.end();
        });

        socket.on('error', (err) => {
            socket.destroy();
            reject(err);
        });
    });
}