const proxyquire = require('proxyquire').noCallThrough()
const sinon = require('sinon')
const synapseMatser = proxyquire('./cluster-synapse', {
	'cluster': {
		isMaster: true,
		on: sinon.spy()
	},
	'event': {
		on: sinon.spy(),
		emit: sinon.spy()
	}
})

const synapseWorker = proxyquire('./cluster-synapse', {
	'cluster': {
		isMaster: false
	},
	'event': {
		on: sinon.spy(),
		emit: sinon.spy()
	}
})

describe('cluster-synapse', function() {

	it()
})