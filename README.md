# cluster-synapse

`cluster-synapse` is an easy to use, minimalistic `cluster` communication tool. It provides a wrapper around the native `cluster` module and gives you a simple API (very similar to events) to send messages between the `worker` and `master` process, or between `worker`s.
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
	3. [emit](#emit-messagetypestring-messageobject-sendtoselfboolean)
	4. [transform](#transformmessagetypestring-interceptorfunction)

## Installation
`cluster-synapse` does not have any external dependencies.

```shell
npm install --save cluster-synapse
```



## Usage

### setup
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
synapse.emit('justCalling')

// send message to all worker processes with data
synapse.emit('somethingForYou', { gift: 'Surprise!' })
```


`worker.js`

By default a `worker` `send`s messages to other `worker`s via the `master` process. The `master` process is able to intercept worker messages by adding a `listener` to the messages type (`synapse.on('someType', interceptingFunction)`).

```javascript
// send message without data
synapse.emit('helloWorld')

// send message with data
synapse.emit('hereComesData', { stuff: 'I made this up...'})

// send message to all workers (including the worker sending the message)
synapse.emit('thisWillComeBackToMe', { stuff: 'Just stuff'}, true)
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

	synapse.emit('msgFromMaster', { msg: 'Master did something and wants to tell you...'})

})
```

### manipulating message data
If you just want to manipulate data and send them back to the worker processes, you can use `synapse.transform` in the `master` process.

```javascript
// 
synapse.transform('dataToProcess', data => {
	
	data.foo = 'bar'

	return data

})