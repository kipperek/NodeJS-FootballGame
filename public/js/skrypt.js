"use strict";
$(document).ready(function(){

//-------Rysowanie Gry--------------------------------------------------
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

		//Rysowanie prawidłowe----------------------
		//------------------------------------------
		function drawField(data){
			var el = $("#gameField");
			var fieldY = 21;
			var fieldX = 15;
			var hoverCurrent = "none";
			var hoverTarget = "none";

			//----Rysowanie pola-------------------
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

			//----Interakcja ;)--------------------
			//złóż stringa dla jquery
			var attrString = function(x,y){
				return "div[data-x="+x+"][data-y="+y+"]";
			}

			var addLineHover = function(e){
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

			var removeLineHover = function(e){
				$(this).css('background-image',hoverTarget);
				$(attrString(data.current.x,data.current.y)).css('background-image',hoverCurrent);
			}

			var lineClick = function(e){
				$( ".fieldPiece" ).unbind();
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
			//--Iterakcja 'właściwa'--------------------------------
			if(data.user ==  $("#usr_id").text())
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

		//drawField(data1);

		//--------------------------------Start---------------------------------------
		var socket;
		$('#start').click(function(e){
			socket = io.connect('http://' + location.host);
			socket.on('connect', function () {
	            $('#start').attr('disabled','disabled');
	            socket.emit('message', {start: true, name: $("#name").val()});
        	});

			//getToken
        	socket.on("token", function (data) {
        		var tokenBox ="<div class='invisible'>";
        		tokenBox += "<div id='token'>" + data.token + "</div>";
        		tokenBox += "<div id='usr_id'>" + data.id + "</div>";
        		tokenBox += "<div id='usr_name'>" + data.name + "</div>";
        		tokenBox += "</div>";

        		$('body').append(tokenBox);
        	});

        	socket.on('disconnect', function () {
           		$('#start').removeAttr('disabled');
        	});
        	//otrzymalem wiadomość
        	socket.on("echo", function (data) {
        		drawField(data);
        	});

		});
});
