const synapse = require('../../src/cluster-synapse')

synapse.emit('dataToTransform', { color: 'red' }, true)

synapse.on('dataToTransform', data => {

	synapse.emit('transformedData', data)
	
	process.exit(0)

})
