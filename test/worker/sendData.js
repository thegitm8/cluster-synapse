const synapse = require('../../src/cluster-synapse')

synapse.emit('data', { test: 'testData' })

process.exit(0)