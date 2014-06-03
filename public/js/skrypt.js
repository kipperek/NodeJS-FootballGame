"use strict";
$(document).ready(function(){
//--------------MODALE--------------------------------------------------------
	var logIn = "<form id='loginForm'><table><tr><td>Username:</td><td><input type='text' id='username' required='required' maxlength='20' pattern='[\\w]{3,}' title='3-20 characters, only a-z, A-Z and 1-9'/>"
		+"</td></tr><tr><td>Password:</td><td><input type='password' id='password' required='required' pattern='[\\w]{3,}' title='Min 3 characters, only a-z, A-Z and 1-9'/></td></tr></table><button type='submit' id='startBtn'>Log in</button></form>"
		+"<span class='modalSpan'><a id='registerA' href='#'>Register</a> if you don't have an account.</span>";

	var waiting = "Waiting for opponent...<div class='loading'></div>";
	var pleaseWait = "Loading please wait...<div class='loading'></div>";

	var register = "<form id='registerForm'><table><tr><td>Username:</td><td><input type='text' id='username' required='required' maxlength='20' pattern='[\\w]{3,}' title='3-20 characters, only a-z, A-Z and 1-9'/>"
		+"</td></tr><tr><td>Password:</td><td><input type='password' id='password' required='required'/></td></tr>"
		+"<tr><td>Re-type<br/>password:</td><td><input type='password' id='password2' required='required' pattern='[\\w]{3,}' title='Min 3 characters, only a-z, A-Z and 1-9'/></td></tr></table><button type='submit' id='startBtn'>Register</button></form>"
		+"<span class='modalSpan'>Go <a id='backA' href='#'>back</a> to log in form.</span>";


	var roomCreation = "<form id='roomForm'><table><tr><td>Room name:</td><td><input type='text' id='roomname' required='required' maxlength='20' pattern='[\\w]{3,}' title='3-20 characters, only a-z, A-Z and 1-9'/>"
		+"</td></tr><tr><td>Enable<br/>password?:</td><td><input type='checkbox' id='enablepass'/></td></tr>"
		+"</td></tr><tr><td>Password:</td><td><input type='password' id='password' required='required' disabled/></td></tr>"
		+"</table><button type='submit' id='startBtn'>Create room</button></form>"
		+"<span class='modalSpan'>Go <a id='backLobby' href='#'>back</a> to lobby.</span>";
	
	var loggedAs = null;
	var modalText = "";
	var top = ($(document).height() / 2) - ($('#modal').height() / 2);
	var left = ($(document).width() / 2) - ($('#modal').width() / 2);
	var w,h;
	var rooms = [];
	var socket;
	
	var lastUsr = 0;
	//gdy okno zmieni rozmiar dopasuj modala
	$(window).resize(function(){

		top = ($(window).height() / 2) - ($('#modal').height() / 2);
		left = ($(window).width() / 2) - ($('#modal').width() / 2);
		
		$('#mask').css('width',$(window).width()).css('height',$(window).height());
		$('#modal').css('top', top).css('left', left);
	});
	//schowaj modala
	function exitModal(){
		if($('#modal').css('display') != "none" || $('#mask').css('display') != "none"){
			$('#mask').fadeOut(300);
			$('#modal').animate({'top': top-50, 'opacity': 0},300,function(){$('#modal').hide();});
		}
	}

	//pokaz modala
	function showModal(){
		if(w && h){
			$('#modal').css('width', w).css('height', h);
		}else{
			$('#modal').css('width', 300).css('height', 120);
		}
		top = ($(window).height() / 2) - ($('#modal').height() / 2);
		left = ($(window).width() / 2) - ($('#modal').width() / 2);

		$('#mask').css('width',$(document).width()).css('height',$(document).height()).fadeIn(450);
		$('#modal').html("<div id='modalInput'>"+modalText+"</div>").css('top', top-50).css('left', left).css('opacity', 0);
		$('#modal').show();
		var margin_top = ($('#modal').height() - $('#modalInput').height()) / 2;
		$('#modalInput').css('margin-top', margin_top);
		$('#modal').animate({'top': top, 'opacity': 1},450);
	}


	//pokaz / chowaj modala
	function manageModal(text,wi,he){
		if(wi & he){
			w = wi;
			h = he;
		}else{
			w = false;
			h = false;
		}
		modalText = text;
		if($('#modal').css('display') != "none")
			$('#modal').animate({'top': top-50, 'opacity': 0},300,showModal);
		else
			showModal();
		
	}
	
	//Zarządzanie GUI MENU------------------------------------
	//cliknieto w wroc do logowania
	var clickBackToLogin = function(e,mg,nw,nh){
		if(e)
			e.preventDefault();


		var myW = 330;
		var myH = 170;
		var myMsg = logIn;

		if(mg && nw && nh){
			myMsg = mg+myMsg;
			myW = nw;
			myH = nh;
		}

		manageModal(myMsg,myW,myH);
		setTimeout(function(){
			$('#registerA').click(clickRegister);
			$('#loginForm').submit(sendLogin);
		},400);
		
	};
	//cliknieto w zarejerstuj sie
	var clickRegister = function(e,mg,nw,nh){
		if(e)
			e.preventDefault();

		var myW = 330;
		var myH = 200;
		var myMsg = register;

		if(mg && nw && nh){
			myMsg = mg+myMsg;
			myW = nw;
			myH = nh;
		}
		manageModal(myMsg,myW,myH);
		setTimeout(function(){
			$('#backA').click(clickBackToLogin);
			$('#registerForm').submit(sendRegister);
			
		},400);
		
	};
	//
	var createRoomForm = function(e){
		e.preventDefault();
		var name = $('#roomname').val();
		var pass = $('#password').val();
		var isPass = $('#enablepass').is(':checked');
		
		socket.emit('createRoom',{"name": name, "blocked": isPass, "pass": pass});
		showLobby();

	}



	var showRoomForm = function(e){
		if(e)
			e.preventDefault();

		manageModal(roomCreation,330,200);
		setTimeout(function(){
			$('#backLobby').click(showLobby);
			$('#roomForm').submit(createRoomForm);
			$('#enablepass').click(function(e){
				
				$("#password").prop('disabled', !$(this).is(':checked')  );
			});
			
		},400);

	}

	var setRooms = function(){
		var lob = $("#lobby");
		var table ="<table class='lobTable'>";

		$.each(rooms,function(i,el){
			var lock = "lock";
			if(el.blocked)
				lock+= " blocked";

			table+= "<tr id='"+el.id+"'><td>"+el.name+"</td><td>"+(el.redTeam.length + el.blueTeam.length)+"</td><td><div class='"+lock+"'></div></td><td><button class='joinBtn' id='"+el.id+"'>Join</button></td></tr>";
		});
		table+="</table>";

		lob.html(table);

		$('.joinBtn').click(function(e){
			var id = $(this).attr('id');
			var room = findRoom(id);
			//if(room.blocked)

			socket.emit('joingame',{"name": loggedAs, "id": id });
			startGame();
		});
	}


	//SHOW LOBBY
	var showLobby = function(e){
		if(e)
			e.preventDefault();

		var mg = "<span class='modalSpan'>Welcome <b> "+loggedAs+" </b></span><div id='lobbyLinks'><a href='#' id='createRoom'>Create room</a><br/><a href='/logout'>Log out</a></div><div id='lobby'></div>"
		manageModal(mg,330,480);
		setTimeout(function(){
			setRooms();
			$('#createRoom').click(showRoomForm);
			
			
		},400);
	}


	//FORMULARZ REJERSTRACJI WYPEŁNIONY
	var sendRegister = function(e){
		e.preventDefault();
		var username = $('#username').val();;
		var pass = $('#password').val();
		var retype = $('#password2').val();
		//pokaz czekanie
		manageModal(pleaseWait);
		//poczekaj sekunde zeby nic przypadkiem sie nie zbugowalo i zeby pokazac pieknie czekanie :)
		setTimeout(function(){
			console.log($('#password').val());
			if(pass != retype){
				clickRegister(false,"<span class='modalSpan red'>Password does not match the re-type</span>",330,220);
				
			}else if(false){

			}else{
				$.ajax({
					type: "GET",
					url: "/register/"+username+"/pass/"+pass
				}).done(function(data) {
				  if(data.done){
					clickBackToLogin(false,"<span class='modalSpan green'>"+data.msg+"</span>",330,198);
				  }else{
				  	clickRegister(false,"<span class='modalSpan red'>"+data.msg+"</span>",330,220);
				  }
				})
				.fail(function() {
				  clickRegister(false,"<span class='modalSpan red'>An error occured, try again</span>",330,220);
				});
			}
		},1000);
	}



	//FORMULARZ LOGOWANIA WYPEŁNIONY
	var sendLogin = function(e){
		e.preventDefault();
		var username = $('#username').val();;
		var pass = $('#password').val();
		//oczekiwanie
		manageModal(pleaseWait);
		//poczekaj sekunde zeby nic przypadkiem sie nie zbugowalo i zeby pokazac pieknie czekanie :)
		setTimeout(function(){
			$.ajax({
					type: "POST",
					url: "/login?username="+username+"&password="+pass
				}).done(function(data) {
				  if(data.done){
				  	loggedAs = data.username;
					showLobby(false);
					connectToSocket();
				  }else{
				  	clickBackToLogin(false,"<span class='modalSpan red'>"+data.msg+"</span>",330,175);
				  }
				})
				.fail(function() {
					clickBackToLogin(false,"<span class='modalSpan red'>Invalid username or password</span>",330,175);
				});
		},1000);

	}

	var findRoom = function(id){
		var room = null;
		$.each(rooms,function(i, el){
			if(el.id == id)
				room = el;
		});

		return room;
	}
	
	var showWin = function(msg){
		manageModal(msg + "<div><a href='#' id='goLobby'>Go back</a> to lobby</div>");
		setTimeout(function(){
			$('#restart').unbind('click').click(function(){
				socket.emit('restart'," ");
				exitModal();
			});
			$('#goLobby').click(function(e){
				e.preventDefault();
			});	
			
		},400);
	}
	
//-------GRA--------------------------------------------------
	//Sprawdzamy jakie linie rysowac w polu
	function generateLine(startPoint, endPoint, color){
			var start =".png";
			var end =".png";

			//--Y----------------------------------
			if(startPoint.y == endPoint.y){
				start = "0"+start;
				end = "0"+end;
			}else if(startPoint.y > endPoint.y){
				start = "2"+start;
				end = "1"+end;
			}else{
				start = "1"+start;
				end = "2"+end;
			}
			//--X-----------------------------------
			if(startPoint.x == endPoint.x){
				start = "0"+start;
				end = "0"+end;
			}else if(startPoint.x < endPoint.x){
				start = "2"+start;
				end = "1"+end;
			}else{
				start = "1"+start;
				end = "2"+end;					
			}
			//--Color-------------------------------
			if(color == "b"){
				start = "b/b_"+start;
				end = "b/b_"+end;
			}else{
				start = "r/r_"+start;
				end = "r/r_"+end;
			}
			return {
				first: "/img/" +start,
				second: "/img/"+ end
			}
		}
		//złóż stringa dla jquery
		var attrString = function(x,y){
			return "div[data-x="+x+"][data-y="+y+"]";
		}

	

		//-------Rysowanie prawidłowe(pola gry)------------
		//-------------------------------------------------
		function drawField(data){
			//globals""
			var el = $("#gameField");
			var fieldY = 21;
			var fieldX = 15;
			var hoverCurrent = "none";
			var hoverTarget = "none";
			var hoverON = false;
			//----Rysowanie pola po raz pierwszy
			function generateField(){
				var fieldHTML= "";
				for(var i =0; i < fieldY; i++){
					fieldHTML+="<div class='fieldWrap'>";
					for(var j=0; j < fieldX; j++){

						var currentClass = "";
						if(data.current.x == j && data.current.y == i)
							currentClass = 'current';

						fieldHTML += "<div class='fieldPiece' data-x='"+j+"' data-y='"+i+"'><div class='dot "+currentClass+"'></div></div>";
					}
					fieldHTML += "</div>";
				}

				el.html(fieldHTML);
			}

			function modifyField(){
				$(".dot").removeClass("current");
				$(attrString(data.current.x,data.current.y) + " div").addClass("current");


			}

			//-----------hover gdy najezdzamy na mozliwy ruch------------------------
			var addLineHover = function(e){
				hoverON = true;
				var graph = generateLine({x: data.current.x, y: data.current.y},{x: $(this).attr("data-x"), y: $(this).attr("data-y")},data.now);
				var start = "url("+graph.first+")";
				var end = "url("+graph.second+")";

				hoverTarget = $(this).css('background-image');
				hoverCurrent = $(attrString(data.current.x,data.current.y)).css('background-image');
				
				if(hoverCurrent != "none")
					start = hoverCurrent + ", " + start;

				if(hoverTarget != "none")
					end = hoverTarget + ", " + end;


				$(this).css('background-image',end);
				$(attrString(data.current.x,data.current.y)).css('background-image',start);
				
			}

			//i jego usuwanie
			var removeLineHover = function(e){
				if(hoverON){
					hoverON = false;
					$(this).css('background-image',hoverTarget);
					$(attrString(data.current.x,data.current.y)).css('background-image',hoverCurrent);
				}
			}

			//klikniecie gdy nasza kolej-----
			var lineClick = function(e){
				$( ".fieldPiece" ).unbind();
				$(".dot").removeClass("current").removeClass("move");

				var newEnd = {x: parseInt($(this).attr('data-x')), y:parseInt($(this).attr('data-y'))};
				var newLine = {
					color: data.now,
					start: data.current,
					end: newEnd
				};
				var send = {
					path: newLine,
					token: $('#token').text()
				};
				socket.emit('message', send);
			}
			///////////////---------------------------------DZIAŁANIE FUNKCJI RYSOWANIA---------------------------------------------------------
			//Rysuj poraz pierwszy pole
			if(data.path.length == 0 || data.connect)
				generateField();
			else
				modifyField();

			//--Iterakcja 'właściwa'--------------------------------
			if(data.user ==  $("#usr_id").text() && !data.win && !data.connect)
				$.each(data.moves,function(i,el){
					if(!el.forbidden){
						$(attrString(el.x,el.y)).hover(addLineHover,removeLineHover);
						$(attrString(el.x,el.y)).click(lineClick);
						$(attrString(el.x,el.y) + " div").addClass('move');
					}
				});	
			//----Rysowanie ścieżki----------------
			$.each(data.path,function(i,line){
				
				//--Ustawienie--------------------------
				var graph = generateLine(line.start,line.end,line.color);
				var start = "url("+graph.first+")";
				var end = "url("+graph.second+")";

				if($(attrString(line.start.x,line.start.y)).css('background-image') != "none"){
					start = $(attrString(line.start.x,line.start.y)).css('background-image') + ", " + start;
				}

				if($(attrString(line.end.x,line.end.y)).css('background-image') != "none"){
					end = $(attrString(line.end.x,line.end.y)).css('background-image') + ", " + end;
				}

				$(attrString(line.start.x,line.start.y)).css('background-image',start);
				$(attrString(line.end.x,line.end.y)).css('background-image',end);

				$(attrString(line.start.x,line.start.y) + " div").addClass('flagged');
				$(attrString(line.end.x,line.end.y) + " div").addClass('flagged');
			});
		}
		//----------------------------------------------------------------------------

		//--------------------------------Sockets---------------------------------------
		
		var connectToSocket = function(){
			socket = io.connect('http://' + location.host);

			
			socket.on('connect', function () {
				socket.on('newLobbies',function (data) {
        			rooms = data.rooms;
        			setRooms();
        		});

	            // $('#startBtn').attr('disabled','disabled');
	            // if($('#token').text() == "")
	            // 	socket.emit('message', {start: true, name: $("#name").val()});
        	});

		}
		var startGame = function(){
			exitModal();
			socket.on("token", function (data) {
        		$(".invisible").remove();
        		var tokenBox ="<div class='invisible'>";
        		tokenBox += "<div id='token'>" + data.token + "</div>";
        		tokenBox += "<div id='usr_id'>" + data.id + "</div>";
        		tokenBox += "<div id='usr_name'>" + data.name + "</div>";
        		tokenBox += "</div>";

        		$('body').append(tokenBox);
        	});

        	socket.on('teams', function (data) {
        		if(data.blue.length == 0 || data.red.length == 0)
        			manageModal(waiting);
        		else
        			exitModal();

        		var redTeam = "";
        		var blueTeam = "";
        		$.each(data.red,function(i, el){
        			redTeam += "<div class='teamName'>"+el.name+"<div class='redArrow' id='arrow"+el.id+"'></div></div>";
        		});
        		$.each(data.blue,function(i,el){
        			blueTeam += "<div class='teamName'>"+el.name+"<div class='blueArrow' id='arrow"+el.id+"'></div></div>";
        		});
        		$('#rteam').html(redTeam);
        		$('#bteam').html(blueTeam);

        		$("#arrow"+data.id).fadeIn(400);
        		lastUsr = data.id;
        	});

        	//----get game message-------------------------
        	socket.on("echo", function (data) {
        	
        		var showArrow = function(){
        			$("#arrow"+data.user).fadeIn(400);
        			lastUsr = data.user;
        		}
        		if(lastUsr != data.user && !data.connect)
        			$(".redArrow, .blueArrow").fadeOut(400,showArrow);
        		

        		$('div').unbind();
        		drawField(data);
        		        		
        		if(data.win == "b")
        			showWin("<div class='blueWin'>Blue Team WINS!</div><button id='restart'>RESTART</button>");
        		else if(data.win == "r")
        			showWin("<div class='redWin'>Red Team WINS!</div><button id='restart'>RESTART</button>");
        		else if(data.win == "rb")
        			manageModal("<div class='draw'>DRAW!</div><button id='restart'>RESTART</button>");		
				
        	});


		}
		
		/*
		
		$('#start').submit(function(e){
			e.preventDefault();
			socket = io.connect('http://' + location.host);
			socket.on('connect', function () {
	            $('#startBtn').attr('disabled','disabled');
	            if($('#token').text() == "")
	            	socket.emit('message', {start: true, name: $("#name").val()});
        	});

			//----getToken-------------------------------------
        	socket.on("token", function (data) {
        		$(".invisible").remove();
        		var tokenBox ="<div class='invisible'>";
        		tokenBox += "<div id='token'>" + data.token + "</div>";
        		tokenBox += "<div id='usr_id'>" + data.id + "</div>";
        		tokenBox += "<div id='usr_name'>" + data.name + "</div>";
        		tokenBox += "</div>";

        		$('body').append(tokenBox);
        	});
        	//----set teams----------------------------------
        	socket.on('teams', function (data) {
        		if(data.blue.length == 0 || data.red.length == 0)
        			manageModal(waiting);

        		var redTeam = "";
        		var blueTeam = "";
        		$.each(data.red,function(i, el){
        			redTeam += "<div class='teamName'>"+el.name+"<div class='redArrow' id='arrow"+el.id+"'></div></div>";
        		});
        		$.each(data.blue,function(i,el){
        			blueTeam += "<div class='teamName'>"+el.name+"<div class='blueArrow' id='arrow"+el.id+"'></div></div>";
        		});
        		$('#rteam').html(redTeam);
        		$('#bteam').html(blueTeam);

        		$("#arrow"+data.id).fadeIn(400);
        		lastUsr = data.id;
        	});

        	socket.on('disconnect', function () {
           		$('#startBtn').removeAttr('disabled');
        	});

        	//----get game message-------------------------
        	socket.on("echo", function (data) {
        		var showArrow = function(){
        			$("#arrow"+data.user).fadeIn(400);
        			lastUsr = data.user;
        		}
        		if(lastUsr != data.user && !data.connect)
        			$(".redArrow, .blueArrow").fadeOut(400,showArrow);
        		if(!data.connect)
        			exitModal();

        		$('div').unbind();
        		drawField(data);
        		if(data.win == "b")
        			manageModal("<div class='blueWin'>Blue Team WINS!</div><button id='restart'>RESTART</button>");
        		else if(data.win == "r")
        			manageModal("<div class='redWin'>Red Team WINS!</div><button id='restart'>RESTART</button>");
        		else if(data.win == "rb")
        			manageModal("<div class='draw'>DRAW!</div><button id='restart'>RESTART</button>");

        		//----RESTART------------------------------------
				$('#restart').click(function(){
					socket.emit('restart'," ");
				});

        	});
		});//KONIEC STARTU GRY
		*/

	//ZRÓB GDY ZAŁADOWANO
	clickBackToLogin();
});//JQUERY END
