const app = require('express')()
const synapse = require('../cluster-synapse')

let suspicious = false
let ninjasKilled = 0
let fighting = false
const log = msg => console.log(`[${process.pid}] => ${msg}`)

synapse.on('ping', () => log('pong'))

synapse.on('falseNinjaAlarm', ({ ninjasDetected }) => {

	if(!suspicious)
		return log(`Phew!! ${ninjasDetected} ninjas detected.`)

	// wait a minute...
	log('Guys! Be carefull! This looks like a ninja trick...')
	synapse.send('whisperSilentWarning')
	return 

})

synapse.on('whisperSilentWarning', () => {

	suspicious = true
	log('Got it! There are ninjas in the house. I\'m prepared.')

})

synapse.on('getBackToWork', () => {

	if(!suspicious)
		return log('getting back to work.')

	log('That\'s a trick. Start to fight ninjas.')
	fighting = true
	const interval = setInterval(() => {

		if(!fighting)
			return clearInterval(interval)

		log('Take this ninja scum!')
		ninjasKilled++
		synapse.send('attackNinjas')

	}, 1000)

})

synapse.once('ninjasDefeated', () => {

	fighting = false
	suspicious = false
	log(`The fight is over. I killed ${ninjasKilled} ninjas.`)

})
// send message to other workers
app.get('/ping', (req, res) => {

	synapse.send('ping')

	res.send(`[${process.pid}] => Pinged all my worker friends.\n`)

})

// sending message to master
app.get('/pingMaster', (req, res) => {

	synapse.send('PING')

	res.send(`[${process.pid}] =>  Pinged the master.\n`)

})

app.get('/ninjaAlarm', (req, res) => {

	log('I think we have ninja problem...')
	synapse.send('ninjaAlarm', { ninjasDetected: 120 })

	suspicious = true

	res.send(`[${process.pid}] => Told master about the ninjas.`)

})


// sending a notification to master after server is running
app.listen(9999, () => synapse.send('workerStarted'))
