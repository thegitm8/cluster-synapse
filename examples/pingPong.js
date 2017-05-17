const cluster = require('cluster')
const os = require('os')
const synapse = require('../../cluster-synapse')

console.log(synapse)

if(cluster.isMaster) {

	synapse.on('ping', () => console.log('pong'))

	for(let i = 0; i < os.cpus().length; i++) {
		cluster.fork()

	}

} else {

	try{
		synapse.send('ping')
	} catch(err) {
		console.log(err.message)
	}

}