const cluster = require('cluster')
const synapse = require('../src/cluster-synapse')

if(cluster.isMaster) {

	synapse.transform('changeRobe', data => {

		console.log('MASTER => Changing robes color to blue.')
		return { color: 'blue' }

	})

	cluster.fork()


} else {

	console.log('WORKER => My robes are red.')
	synapse.emit('changeRobe', { color: 'red' }, true)

	synapse.on('changeRobe', data => {


		console.log('WORKER => Now they are', data.color)

		process.exit()

	})

}