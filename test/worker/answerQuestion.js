const synapse = require('../../src/cluster-synapse')

synapse.on('question', () => {

	synapse.emit('answer')
	
	process.exit(0)

})

