$(document).ready(function(){
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


		function drawField(data){
			var el = $("#gameField");
			var fieldY = 21;
			var fieldX = 15;

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
				var graph = generateLine({x: data.current.x, y: data.current.y},{x: $(this).attr("data-x"), y: $(this).attr("data-y")},"b");
				var start = "url("+graph.first+")";
				var end = "url("+graph.second+")";
				
				$(this).css('background-image',end);
				$(attrString(data.current.x,data.current.y)).css('background-image',start);
			}

			var removeLineHover = function(e){
				$(this).css('background-image','none');
				$(attrString(data.current.x,data.current.y)).css('background-image','none');
			}

			var lineClick = function(e){
				$( ".fieldPiece" ).unbind();
				var newEnd = {x: parseInt($(this).attr('data-x')), y:parseInt($(this).attr('data-y'))};
				var newLine = {
					color: "b",
					start: data.current,
					end: newEnd
				};
				data.current = newEnd;
				data.path.push(newLine);
				drawField(data);
			}

			for(var i= -1; i<= 1; i++)
				for(var j= -1; j<= 1; j++){
					if(i !=0 || j !=0){
						$(attrString((data.current.x+i),(data.current.y+j))).hover(addLineHover,removeLineHover);
						$(attrString((data.current.x+i),(data.current.y+j))).click(lineClick);
						$(attrString((data.current.x+i),(data.current.y+j)) + " div").addClass('move');
					}
				}
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
		

			//MOKOWANIE
			var data1 = {
				moves:
				[{
					x: 8,
					y: 11
				},
				{
					x: 7,
					y: 11
				}],

				current: {x: 7, y:10},
				path: []
				/*[{
					color: "b",
					start: {x: 1, y:1},
					end: {x:1,y:2}
				},
				{
					color: "b",
					start: {x: 1, y:2},
					end: {x:2,y:2}
				},
				{
					color: "b",
					start: {x: 2, y:2},
					end: {x:3,y:3}
				}]*/
			}
			//-------------------------------------

		drawField(data1);
});
