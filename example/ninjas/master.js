const cluster 	= require('cluster')
const os 		= require('os')
const synapse 	= require('../cluster-synapse')

const log = msg => console.log(`[MASTER] => ${msg}`)
let ninjas = 0

// getting messages from workers
synapse.on('workerStarted', ({ worker }) => log(`Started worker [${worker.process.pid}].`))
synapse.on('PING', () => log('PONG'))

synapse.on('ninjaAlarm', ({ data }) => {

	log('Ninjas are allready here. Muhahaha... Everything is allright. No danger...')
	ninjas = data.ninjasDetected

	synapse.send('falseNinjaAlarm', { ninjasDetected: 0 })

	// let them calm down and then get them back to work
	setTimeout(() => synapse.send('getBackToWork'), 2000)

})

synapse.on('attackNinjas', ({ worker }) => {

	log(`worker ${worker.process.pid} has killed a ninja.`)
	if(--ninjas <= 0)
		synapse.send('ninjasDefeated')

})
// setup your cluster as you normally would
const numWorkers = os.cpus().length

cluster.setupMaster({ exec: 'example/worker.js' })

for(let i = 0; i < numWorkers; i++) {

	cluster.fork()

}
