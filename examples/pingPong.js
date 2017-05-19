const cluster = require('cluster')
const synapse = require('../src/cluster-synapse')

if(cluster.isMaster) {

	synapse.on('ping', () => console.log('pong'))

	cluster.fork()


} else {

	synapse.emit('ping')

}