const express = require('express')
const app = express()
const fs = require("fs")
const http = require('http').Server(app)
const port = process.env.PORT || 3000
/* Middlewares	  */

app.use('/static',express.static(__dirname + "/static"))
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

/* server stuff	  */

const server = http.listen(port, () => {
	console.log(`listening on http://localhost:${port}/`)
});

app.get('/',(req,res)=>{
	res.statusCode=200
	res.sendFile(__dirname+'/index.html')
})

app.get("/listAllUsers",async (req,res)=>{
		res.setHeader('Content-Type', 'application/json');
		res.json(require('./static/db/db.json'))
})

/* socket.io stuff  */
const io = require('socket.io')(server)
io.on('connection',(socket)=>{
	socket.on('stream',(data)=>{
		var newData = data.split(";");
		newData[0] = "data:audio/ogg;";
		newData = newData[0] + newData[1];
		socket.to(socket.data.channel).emit("audio",newData);
	})
	socket.on("usrInfo",async (data)=>{
		//	addUser(data.id,data)
		socket.data.usrId=data.id
		socket.join(data.channel)
		socket.data.channel=data.channel
		socket.data.name=data.name
		try{
		const clients = await io.in(socket.data.channel).fetchSockets()
		const ret = []
		clientsArr=[...clients]
		for (const client of clientsArr ) {
	//		const client = io.sockets.sockets.get(clientId);
			ret.push({"id":client.data.usrId,"name":client.data.name})
		}
		io.sockets.in(data.channel).emit('newUser', ret);
		}catch(e){
			console.log(e)
		}})
	socket.on("usrMsg",(msg)=>{
		socket.to(socket.data.channel).emit("msg",{sender:`${socket.data.name}#${socket.data.usrId}`,"msg":msg,time:getTimeStamp()})
	})
	socket.on('videoStream',data=>{
		console.log(data)
	})
	socket.on("disconnect",async ()=>{
		console.log("disconnect")
		console.log(socket.data.usrId);
		socket.leave(socket.data.channel)
		//	removeUser(socket.data.usrId)
try{
	const clients = await io.in(socket.data.channel).fetchSockets()
//	console.log(clients)
		const ret = []
		clientsArr=[...clients]
		for (const client of clientsArr ) {
	//		const client = io.sockets.sockets.get(clientId);
			ret.push({"id":client.data.usrId,"name":client.data.name})
		}

		io.sockets.in(socket.data.channel).emit('newUser', ret);

}catch(e){
	console.log(e)
}})
})


/* DB-utils  */

const getDB = (filePath,cb)=>{
	fs.readFile(filePath, (err, fileData) => {
		if (err) {
			return cb && cb(err);
		}
		try {
			const object = JSON.parse(fileData);
			return cb && cb(null, object);
		} catch (err) {
			return cb && cb(err);
		}
	});
}

const listAllUsers=async ()=>{
	var data;
	getDB("./static/db/db.json", async (err, users) => {
		if (err) {
			console.log(err);
			return;
		}
		//	console.log(users)
		data = users
	});
	return data;


}

const addUser=async (usrId,usrStatus)=>{

	getDB("./static/db/db.json", async (err,users) => {
		if (err) {
			console.log("Error reading file:", err);
			return;
		}

		users[usrId]=usrStatus
		fs.writeFile("./static/db/db.json", JSON.stringify(users), err => {
			if (err) console.log("Error writing file:", err);
		});
		listAllUsers()
	});
}

const removeUser = (usrId) => {
	getDB("./static/db/db.json", async (err,users) => {
		if (err) {
			console.log("Error reading file:", err);
			return;
		}
		delete users[usrId]
		fs.writeFile("./static/db/db.json", JSON.stringify(users), err => {
			if (err) console.log("Error writing file:", err);
		});
		listAllUsers()
	});

}

const getUser=(usrId)=>{
	getDB("./static/db/db.json", async (err, users) => {
		if (err) {
			console.log(err);
			return;
		}
		return (users[usrId]);
	});


}
function getTimeStamp() {
    var now = new Date();
    return ((now.getDate()) + '/' +
            (now.getMonth()+1) + '/' +
             now.getFullYear() + " " +
             now.getHours() + ':' +
             ((now.getMinutes() < 10)
                 ? ("0" + now.getMinutes())
                 : (now.getMinutes())) + ':' +
             ((now.getSeconds() < 10)
                 ? ("0" + now.getSeconds())
                 : (now.getSeconds())));
}
