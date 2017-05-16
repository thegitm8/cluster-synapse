/**
 * cluster-synapse
 * 
 */
'use strict'

const cluster 		= require('cluster')
const EventEmitter 	= require('events')


module.exports = (function clusterSynapse() {

	const _event = new EventEmitter()
	const _templates = {}
	const _shape = (data, shapes) => shapes.reduce(( accData, shapeFunc ) => shapeFunc(accData), data)

	if(cluster.isMaster) { // setup master process

		// add listener to all new workers
		cluster.on('fork', worker => {

			worker.on('message', message => {

				// if master has any listeners on the messaeg type, emit the message 
				if(_event.listenerCount(message.type))
					return _event.emit(message.type, {
						type: message.type,
						data: message.data,
						worker
					})

				// if master has any transformation listeners, run listeners on the data and send it back
				if(_templates[message.type])
					return send(message.type, Object.assign({},
						message,
						{
							data: _shape(message.data, _templates[message.type])
						}
					))

				// else, just relay data to the worker processes
				return send(message.type, message)

			})

		})

	} else { // setup worker process

		// if worker receives message, it emits an msg.type event
		process.on('message', message => _event.emit(message.type, message.data))

		return

	}

	/**
	 * Sending messages to other processes.
	 * 
	 * @param  {String}		type 		type of the message, used to identify message
	 * @param  {any}		message 	message can be of any serializable type
	 * @param  {Boolean}	sendToSelf	determines if the worker wants to be included in the response
	 * 
	 * @return {void}					send has no return value
	 */
	function send(type, message = {}, sendToSelf = false) {

		// if send was called from master
		if(cluster.isMaster) {

			Object.keys(cluster.workers)
				.forEach( key => {

					// if the sending worker sends his pid, do not send to this worker
					if(cluster.workers[key].process.pid !== message.pid)
						return cluster.workers[key].send({
							type,
							data: !!message.data ? message.data : message
						})

				})

			return

		}

		// msg object which gets send to master
		process.send({
			type,
			data: message,
			pid: !sendToSelf ? process.pid : null
		})

		return

	}

	/**
	 * Listen for events triggered by messages from other processes.
	 * 
	 * @param  {String}   type     the message type to listen for
	 * @param  {Function} listener callbackfunction triggered when the [type] event occurs
	 * 
	 * @return {Function} unlisten removes the listener function from the call stack
	 */
	function on(type, listener) {

		return _event.on(type, listener)

	}

	/**
	 * Listen for events triggered by messages from other processes once.
	 * 
	 * @param  {String}   type     the message type to listen for
	 * @param  {Function} listener callbackfunction triggered when the [type] event occurs
	 * 
	 * @return {Function} unlisten removes the listener function from the call stack
	 */
	function once(type, listener) {

		return _event.once(type, listener)

	}

	/**
	 * Transforms data send by a worker, transform the data and send it back to the workers
	 * 
	 * @param  {String}   type     the message type to listen for
	 * @param  {Function} listener callbackfunction triggered when the [type] event occurs
	 * 
	 * @return {void}				transform does not return
	 */
	function transform(type, listener) {

		// transform can only be called from the master process
		if(!cluster.isMaster)
			throw new Error('synapse.transform can only be called from the master process.')

		// 
		if(!_templates[type]) _templates[type] = []

		_templates[type] = [].concat(_templates[type], listener)

		return

	}

	return {
		on: on,
		once: once,
		send: send,
		// master only
		transform: transform
	}

})()
