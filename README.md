# !!! This is not yet ready to use !!!


# cluster-synapse

`cluster-synapse` is an easy to use, minimalistic `cluster` communication tool. It provides a wrapper around the native `cluster` module and gives you a simple API to send messages between the `worker` and `master` process, or between `worker`s.
It does not require you to make any changes to your current cluster setup.

1. [Installation](#installation)
2. [Usage](#usage)
	1. [Setup](#setup)
	2. [sending messages](#sending-messages)
	3. [receiving messages](#receiving-messages)
	4. [manipulating message data](#manipulating-message-data)
3. [API](#api)
	1. [on](#on-messagetypestring-callbackfunction)
	2. [once](#once-messagetypestring-messageobject)
	3. [send](#send-messagetypestring-messageobject-sendtoselfboolean)
	4. [shape](#shapemessagetypestring-interceptorfunction)

## Installation
`cluster-synapse` does not have any external dependencies.

```shell
npm install --save cluster-synapse
```



## Usage

## Setup
You have to require `cluster-synapse` at least once on the master process, to hook into the `cluster` module. Even if you do not use `cluster-synapse` directly on master.

`master.js`

```javascript
const cluster 	= require('cluster')
const os 		= require('os')
const synapse 	= require('cluster-synapse') // <= here

const numWorkers = os.cpus().length

cluster.setupMaster({ exec: 'worker.js' })

for(let i = 0; i < numWorkers; i++) {

	cluster.fork()

}
```

Everywhere else you can just require and use `cluster-synapse`.

```javascript
const synapse 	= require('cluster-synapse')
```

### sending messages
`master.js`

The master process sends messages to all `workers`.

```javascript
// send message to all worker processes without data
synapse.send('justCalling')

// send message to all worker processes with data
synapse.send('somethingForYou', { gift: 'Surprise!' })
```


`worker.js`

By default a `worker` `send`s messages to other `worker`s via the `master` process. The `master` process is able to intercept worker messages by adding a `listener` to the messages type (`synapse.on('someType', interceptingFunction)`).

```javascript
// send message without data
synapse.send('helloWorld')

// send message with data
synapse.send('hereComesData', { stuff: 'I made this up...'})

// send message to all workers (including the worker sending the message)
synapse.send('thisWillComeBackToMe', { stuff: 'Just stuff'}, true)
```

### receiving messages
`master.js`

Setting a listener on the `master` process intercepts the message a worker is sending. Thus, making the master process responsible for further handling the message.

```javascript
// receive message from worker, without notifying other worker processes (single worker to master communication)
synapse.on('msgToMaster', msg => { /* do something with data */})

// receiving a message from a worker process and sending a message to all workers
synapse.on('msgToMaster', msg => {

	/* do something with data */

	synapse.send('msgFromMaster', { msg: 'Master did something and wants to tell you...'})

})
```

### manipulating message data
If you just want to manipulate data and send them back to the worker processes, you can use `synapse.shapeOn` in the `master` process.

```javascript
// 
synapse.shapeOn('dataToProcess', data => {
	
	data.foo = 'bar'

	return data

})
```



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

#### send( messageType:String, message:Object, sendToSelf:Boolean)
`send` sends a data object to all workers and can be used both on the master process and the worker. Both `data` and `sendToSelf` are optional. This way, you can use `send('someEvent')` to trigger actions on the workers which do not require additional data.

`sendToSelf` is only recognised when called from a worker process. The default behaviour of `send` on worker processes is, to send the event to it's sibling worker process, but not back to itself. You have to set `sendToSelf` to `true` if you want the worker process to be called back. `sendToSelf` needs to be `true` if you want to use `interceptor`s on the master process and your current process needs to get the intercepted data as well.

Internally `send` determines the `worker`s to send the message to, by cheking `data.pid` on incoming messages from `worker` processes. If a `worker` sends a message and `sendToSelf` is set to `false` (default), the `master` process will not send his response to this particular `worker`.

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