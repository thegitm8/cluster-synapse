const cluster = require('cluster')
const os = require('os')
const synapse = require('../../cluster-synapse')

if(cluster.isMaster) {

	synapse.on('ping', () => console.log('pong'))

	for(let i = 0; i < os.cpus().length; i++) {
		cluster.fork()

	}

} else {

	synapse.emit('ping')

}