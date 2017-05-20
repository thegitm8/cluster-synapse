## API

#### on( messageType:String, listener:Function)
`synapse.on()` registers `listener` function for the `messageType` event.

`worker`

If you register a listener function on the worker process, the listener receives the send data as the parameter.

```javascript
// send data somewhere
synapse.send('someEvent', { stuff: 'Map to the gold.' })

// receive data on the worker process
synapse.on('someEvent', data => {

	console.log(data.stuff)
	// prints: Map to the gold.

})
```

`master`

On the master process, the listener always receives an object containing the instance of the sending worker and the data (if the sender provides data).

```javascript
// send data on the worker process
synapse.send('someEvent', { stuff: 'Map to the gold.' })

// getting data on the master process
synapse.on('someEvent', msg => {

	// msg.worker is an instance of the cluster.worker class
	const senderPID = msg.worker.process.pid

	// msg.data contains the send data
	const extractedData = msg.data.stuff

	console.log(senderPID, extractedData)
	// will print: 5438, 'Map to the gold.
	// where 5438 is the sending workers PID

})
````

#### once( messageType:String, message:Object)
Same as `on`, but listener is called only on the first occurance of the event.

#### emit( messageType:String, message:Object, sendToSelf:Boolean)
`emit` sends a data object to all workers and can be used both on the master process and the worker. Both `data` and `sendToSelf` are optional. This way, you can use `emit('someEvent')` to trigger actions on the workers which do not require additional data.

`sendToSelf` is only recognised when called from a worker process. The default behaviour of `send` on worker processes is, to send the event to it's sibling worker process, but not back to itself. You have to set `sendToSelf` to `true` if you want the worker process to be called back. `sendToSelf` needs to be `true` if you want to use `interceptor`s on the master process and your current process needs to get the intercepted data as well.

Internally `emit` determines the `worker`s to send the message to, by cheking `data.pid` on incoming messages from `worker` processes. If a `worker` sends a message and `sendToSelf` is set to `false` (default), the `master` process will not send his response to this particular `worker`.

#### transform(messageType:String, interceptor:Function)
`transform` is used to manipulate data on the master process and send the result back. Multiple `transform` listeners on the same event are called one after the other.

```javascript
// ######## worker.js
synapse.send('ninjaEvent', { clothes: 'white', hidden: false })

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