# API

* [synapse.on](#synapseon-messagetypestring-listenerfunction)
* [synapse.once](#synapseonce-messagetypestring-messageobject)
* [synapse.emit](#synapseemit-messagetypestring-messageobject-sendtoselfboolean)
* [synapse.transform](#synapsetransformmessagetypestring-interceptorfunction)

### synapse.on( messageType:String, listener:Function)
`synapse.on()` registers a `listener` function on the `messageType` event.

`worker.js`

If you register a listener function on the worker process, the listener receives the send data as the parameter.

```javascript
// send data somewhere
synapse.emit('someEvent', { stuff: 'Map to the gold.' })

// receive data on the worker process
synapse.on('someEvent', data => {

	console.log(data.stuff)
	// prints: Map to the gold.

})
```

`master.js`

On the `master` process, the listener always receives an object containing the instance of the sending `worker`, the data (if the sending `worker` provides data) and the eventType. If a listener is registered on an event type, the process will not automatically send any data to the `worker` processes. The `master` process has to take care of this if needed.

```javascript
// send data on the worker process
synapse.emit('someEvent', { stuff: 'Map to the gold.' })

// receiving data on the master process
synapse.on('someEvent', ({ data, worker, type }) => {

	// msg.worker is an instance of the cluster.worker class
	const senderPID = msg.worker.process.pid

	// msg.data contains the send data
	const extractedData = msg.data.stuff

	console.log(`Worker ${senderPID} has send the following data: "${extractedData}"`)
	// Worker 5438 has send the following data: "Map to the gold."
	// where 5438 is the sending workers PID

})
````

### synapse.once( messageType:String, message:Object)

Same as `on`, but listener is called only on the first occurance of the event.

### synapse.emit( messageType:String, message:Object, sendToSelf:Boolean)
`emit` sends a data object to all workers and can be used both on the master process and the worker. Both `data` and `sendToSelf` are optional. This way, you can use `emit('someEvent')` to trigger actions on the workers which do not require additional data.

`sendToSelf` is only recognised when called from a `worker process`. The default behaviour of `send` on worker processes is, to send the event to it's sibling `worker` processes, but not back to itself. You have to set `sendToSelf` to `true` if you want the worker process to be called back. `sendToSelf` needs to be `true` if you want to use `transform` on the master process and your current process needs to get the transformed data as well.

Internally `emit` determines the `worker`s to send the message to, by cheking `data.pid` on incoming messages from `worker` processes. If a `worker` sends a message and `sendToSelf` is set to `false` (default), the `master` process will not send his response to this particular `worker`.

### synapse.transform(messageType:String, interceptor:Function)

`transform` is used to manipulate data on the master process and send the result back. Multiple `transform` listeners on the same event are called one after the other. `transform` will throw an error when called on the `worker` process.

```javascript
// ######## worker.js
synapse.emit('ninjaEvent', { clothes: 'white', hidden: false }, true)

// ######## master.js
synapse.transform('ninjaEvent', data => {
	data.clothes = 'black'

	return data

})

synapse.transform('ninjaEvent', data => {

	data.hidden = true

	return data

})

// ######## worker.js
synapse.on('ninjaEvent', console.log)

// will log:
// { clothes: 'black', hidden: true }

```