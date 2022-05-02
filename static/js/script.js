var constraints = {video:{ facingMode: "user" }, audio: true };
var localAudio,localVideo;
var socket;
var policy=false
const time=1000;
var helpBox=false;
var tos=false
const usrStatus = {
	id:null,
	channel:null,
	name:null,
	online:true,
	mic:false,
	speaker:true,
	video:false
}
window.onload=function(){
	socket=io.connect('/');
	socket.on("audio", function (data) {
		if(!usrStatus.speaker) return;
		var audio = new Audio(data);
		audio.play();
	});
	socket.on("msg",(data)=>{
		appendMessage(data)
	})
	socket.on("newUser",(data)=>{
		const users = getBlock("users")
		users.innerHTML=""
		for(const user of data){
			
			users.innerHTML+=`<div id="user" class="user ${randomColor()}">${user.name}#${user.id} ${user.id==usrStatus.id ? "(you)":""}</div>`
		}
	})
	var old = sessionStorage.getItem("id")!=null
	usrStatus.id=old ?sessionStorage.getItem("id") : Math.floor(Math.random()*10000000000);
	usrStatus.name=old ? sessionStorage.getItem("name") :prompt("Enter your name","idiot")
	usrStatus.channel=old ? sessionStorage.getItem("channel"):prompt("Enter a Channel Id to join", Math.floor(Math.random()*1000000000))
	if(usrStatus.name==null || usrStatus.channel==null) 
		location.href="/"
	getBlock("name").innerText=usrStatus.name;
	getBlock("id").innerText=usrStatus.id;
	getBlock("room").innerText=usrStatus.channel;

}

function toggleVideo(e){
		usrStatus.video=!usrStatus.video
	e.setAttribute("src",!usrStatus.video ? "/static/img/videoOff.svg" : "/static/img/video.svg")
	socket.emit("usrInfo",usrStatus)
	if(!usrStatus.video){
		stopVideo();
		return
	}
	navigator.mediaDevices.getUserMedia({video:{ facingMode: "user" }}).then((stream) => {
		const videoStream = new MediaStream(stream.getVideoTracks());
		getBlock("vdo1").srcObject=videoStream
		getBlock("vdo2").srcObject=videoStream
		var videoRecorder = new MediaRecorder(videoStream);
		localVideo=videoStream
		videoRecorder.start();

		var videoChunks = [];

videoRecorder.addEventListener("dataavailable", function (event) {
			videoChunks.push(event.data);
		});

			videoRecorder.addEventListener("stop", function () {
			var videoBlob = new Blob(videoChunks);
			videoChunks = [];
			var fileReader = new FileReader();
			fileReader.readAsDataURL(videoBlob);
			fileReader.onloadend = function () {
				var base64String = fileReader.result;
	//			socket.emit("videoStream", base64String);
			};
			videoRecorder.start();
			setTimeout(function () {
				videoRecorder.stop();
			}, time);
		});
		setTimeout(function () {
			videoRecorder.stop();
		}, time);
	});

}

function muteOutgoing(e){
	usrStatus.mic=!usrStatus.mic
	e.setAttribute("src",!usrStatus.mic ? "/static/img/micMute.svg" : "/static/img/mic.svg")
	socket.emit("usrInfo",usrStatus)
	if(!usrStatus.mic){
		stop();
		return
	}
	navigator.mediaDevices.getUserMedia({audio:true}).then((stream) => {
		const audioStream = new MediaStream(stream.getAudioTracks());
		var audioRecorder = new MediaRecorder(audioStream);
		localAudio=audioStream
		audioRecorder.start();

		var audioChunks = [];

			audioRecorder.addEventListener("dataavailable", function (event) {
			audioChunks.push(event.data);
		});
		audioRecorder.addEventListener("stop", function () {
			var audioBlob = new Blob(audioChunks);
			audioChunks = [];
			var fileReader = new FileReader();
			fileReader.readAsDataURL(audioBlob);
			fileReader.onloadend = function () {
				var base64String = fileReader.result;
				socket.emit("stream", base64String);
			};
			audioRecorder.start();
			setTimeout(function () {
				audioRecorder.stop();
			}, time);
		});
	});
}

function stop(){
		localAudio.getTracks().forEach( (track) => {
		track.stop();
	});
}
function stopVideo(){

localVideo.getTracks().forEach( (track) => {
		track.stop();
	});


}
function appendMessage(data){
	getBlock("msgs").innerHTML+=`
		<div class="msg">
		<div class='sender ${randomColor()}'>${data.sender}</div>
		<div class="msgTxt">${data.msg}</div>
		<div class="time ${randomColor()}">${data.time}</div>
		</div>
	`	
	scrollToBottom()
}
function sendMsg(){
	const inpDiv=getBlock("usrMsg")
	const msgVal = inpDiv.value
	const timeStamp=getTimeStamp()
	inpDiv.value=''
	appendMessage({sender:`${usrStatus.name}#${usrStatus.id}`,msg:msgVal,time:timeStamp})
	socket.emit("usrMsg",msgVal)
}

function muteIncoming(e){
	usrStatus.speaker=!usrStatus.speaker
	e.setAttribute("src",usrStatus.speaker? "/static/img/sound.svg" : "/static/img/noSound.svg");
}

function joinChannel(e){
	sessionStorage.setItem("id", usrStatus.id)
	sessionStorage.setItem("name", usrStatus.name)
	sessionStorage.setItem("channel", usrStatus.channel)
	socket.emit("usrInfo",usrStatus);
	e.style.display="none";
}

function getBlock(id){
	return document.getElementById(id);
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
function randomColor(){
	const colors=["red","skyblue","blue","green","orange","violet","magenta"]
	return colors[Math.floor(Math.random()*colors.length)]
}
function scrollToBottom(){
getBlock("msgs").scrollTo({ left: 0, top: getBlock("msgs").scrollHeight, behavior: "smooth" });
}
function togglePolicy(e){
	policy=!policy
	e.innerHTML=policy ? "Hide Privacy Policy":"Show Privacy Policy"
	getBlock("privacy").style.height=policy?"300px":"0"
}
function toggleHelp(e){
	helpBox=!helpBox
	e.innerHTML=helpBox ? "Hide Help":"Show Help"
	getBlock("helpBox").style.height=helpBox?"600px":"0"
}
function toggleTos(e){
	tos=!tos
	e.innerHTML=tos ? "Hide ToS":"Show Tos"
	getBlock("tos").style.height=tos?"250px":"0"
}
