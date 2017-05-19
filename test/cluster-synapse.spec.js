const cluster = require('cluster')
const sinon = require('sinon')
const expect = require('chai').expect
const synapse = require('../src/cluster-synapse')
// const proxyquire = require('proxyquire').noCallThrough()


describe('cluster-synapse', function() {

	describe('master', function() {

		it('Master process can receive messages from workers.', function(done) {

			const listener = sinon.spy()
			cluster.setupMaster({ exec: 'test/worker/sendStartSignal.js' })
			
			synapse.on('started', listener)

			cluster.fork()
			cluster.fork()

			setTimeout(() => {

				expect(listener.callCount).to.be.equal(2)
				done()

			}, 200)
		})

		it('Master process can send messages to workers.', function(done) {

			const listener = sinon.spy()
			cluster.setupMaster({ exec: 'test/worker/answerQuestion.js' })
			
			synapse.on('answer', listener)

			cluster.fork()
			cluster.fork()

			synapse.emit('question')

			setTimeout(() => {

				expect(listener.callCount).to.be.equal(2)
				done()

			}, 200)
		})

		it('Master process can receive messages with data from workers.', function(done) {

			const listener = sinon.spy()
			const expectedData = 
			cluster.setupMaster({ exec: 'test/worker/sendData.js' })
			
			synapse.on('data', listener)

			const worker = cluster.fork()

			synapse.emit('question')

			setTimeout(() => {

				expect(listener.callCount).to.be.equal(1)
				sinon.assert.calledWith(listener, {
					data: { test: 'testData' },
					type: 'data',
					worker: worker
				})

				done()

			}, 200)
		})

		it('Master process can transform messages from workers.', function(done) {

			const listener = sinon.spy()

			cluster.setupMaster({ exec: 'test/worker/sendTransformedData.js' })
			
			synapse.transform('dataToTransform', data => {

				return { color: 'green' }

			})

			const worker = cluster.fork()

			synapse.on('transformedData', listener)

			setTimeout(() => {

				expect(listener.callCount).to.be.equal(1)

				sinon.assert.calledWith(listener, sinon.match({ data: { color: 'green' } }))

				done()

			}, 200)
		})
	})
})