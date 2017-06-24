# cluster-synapse

[![version](https://img.shields.io/npm/v/cluster-synapse.svg)](https://www.npmjs.com/package/cluster-synapse)
[![npm downloads](https://img.shields.io/npm/dt/cluster-synapse.svg)](https://www.npmjs.com/package/cluster-synapse)
[![liscense](https://img.shields.io/npm/l/cluster-synapse.svg)](https://www.npmjs.com/package/cluster-synapse)
[![Known Vulnerabilities](https://snyk.io/test/github/thegitm8/cluster-synapse/badge.svg)](https://snyk.io/test/github/thegitm8/cluster-synapse)
[![Build Status](https://travis-ci.org/thegitm8/cluster-synapse.svg?branch=master)](https://travis-ci.org/thegitm8/cluster-synapse)

`cluster-synapse` is an easy to use, minimalistic `cluster` communication tool. It provides a non-intrusive wrapper around the native `cluster` module and gives you an event like API to send messages between the `worker` and `master` process, or between `worker` processes.


It does not require you to make any changes to your current cluster setup.

* [Installation](#installation)
* [Usage](#usage)
	- [setup](#setup)
	- [sending messages](#sending-messages)
	- [receiving messages](#receiving-messages)
	- [manipulating message data](#manipulating-message-data)

=> [detailed API docs](https://github.com/thegitm8/cluster-synapse/blob/master/API.md)

## Installation

```shell
npm install --save cluster-synapse
```
`cluster-synapse` does not have any external dependencies.



## Usage

### setup
You have to require `cluster-synapse` at least once on the master process, to hook into the `cluster` module. Even if you do not use `cluster-synapse` directly on master.

`master.js`

```javascript
const cluster 	= require('cluster')
const os 	= require('os')
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

By default a `worker` sends messages to other `worker`s via the `master` process. The `master` process is able to intercept worker messages by adding a `listener` to the messages type (`synapse.on('someType', interceptingFunction)`).

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

Setting a listener on the `master` process intercepts the message a worker is sending. Thus, making the master process responsible for further handling the message. The listener receives a message object containing an instance of the sending worker, data (if send) and the type.

```javascript
// receive message from worker, without notifying other worker processes (single worker to master communication)
synapse.on('msgToMaster', msg => {

	const worker = msg.worker
	const data = msg.data
	const type = msg.type // in this case 'msgToMaster'

	/* do something with data */
})

// receiving a message from a worker process and sending a message to all workers
synapse.on('msgToMaster', msg => {

	/* do something with data */

	synapse.emit('msgFromMaster', { msg: 'Master did something and wants to tell you...'})

})
```

`worker.js`

If not intercepted by the `master` process, the worker process receives messages and the associated data by registering a listener on a specific event.

```javascript

synapse.on('randomEvent', () => {

	/* event without data */
})

synapse.on('differentEventWithData', data => {

	/* Do something with data */
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
