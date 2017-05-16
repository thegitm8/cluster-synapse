const cluster = require('cluster')
const os = require('os')
const synapse = require('../cluster-synapse')

const numWorkers = os.cpus().length


if(cluster.isMaster) {

	synapse.on('masterPing', () => console.log('PONG'))
	
	for(let i = 0; i < numWorkers; i++) {

		cluster.fork()

	}

} else {

	synapse.on('workerPing', () => console.log('pong'))

	// sending messages to all OTHER workers
	synapse.send('workerPing')

	// sending message to the master process
	synapse.send('masterPing')

	// sending message to all workers including himself
	synapse.send('workerPing', null, true)

}