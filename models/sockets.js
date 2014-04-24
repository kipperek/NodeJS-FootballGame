function getNames(red,blue){
    var rTeam = [];
    var bTeam = [];

    for(var i=0; i < red.length; i++)
        rTeam.push(red[i].name);

    for(var i=0; i < blue.length; i++)
        bTeam.push(blue[i].name);

    return {red: rTeam, blue: bTeam};
}


function removeDisconnected(arr,token){
    var deleted = false;
    var index = 0;
    for(var i =0; i < arr.length; i++){
        if(arr[i].token == token){
            index = i;
            deleted = true;
            break;
        }
    }
    if(deleted)
        arr.splice(index, 1);

    return deleted;
}

function generateToken(){
     return Math.random().toString(36).substr(2); 
}

function generateID(tab1,tab2){
    var id = 0;
    var t1 = 0;
    var t2 = 0;

    if(tab1.length > 0)
        t1 = tab1[tab1.length-1].id;

    if(tab2.length > 0)
        t2 = tab2[tab2.length -1].id;

    id = Math.max(t1,t2);

    return id + 1;
}

function createMoves(current){
    var moves = [];
    for(var i=-1; i <= 1; i++)
        for(var j=-1; j <= 1; j++)
            if(j!=0 || i!=0){
                moves.push({ x: current.x + i, y: current.y + j });
            }

    return moves;
}

function comparePath(current, move, start, end){
    if((current.x == start.x && current.y == start.y && move.x == end.x && move.y == end.y)
        || (current.x == end.x && current.y == end.y && move.x == start.x && move.y == start.y))
        return true;
    else
        return false;
}

function generateMoves(current, data){
    var moves = createMoves(current);
    
    //jesteśmy przy ściankach
    if(current.x == 0 || current.x == 14){
        var toDel = [];
        for(var i=0; i< moves.length;i++){
            if(moves[i].x == current.x)
                moves[i].forbidden = true;
        }
    }
    //jesteśmy na środku
    if(current.y == 10){
        var toDel = [];
        for(var i=0; i< moves.length;i++){
            if(moves[i].y == current.y)
                moves[i].forbidden = true;
        }
    }
    //czy ścieżka już nie była wykożystana ;)
    if(data != undefined){
        for(var i=0; i< data.length; i++)
            for(var j=0; j < moves.length;j++)
                if(comparePath(current,moves[j],data[i].start,data[i].end))
                    moves[j].forbidden = true;
    }
    
    return moves;
}

function checkIfCanMoveMore(current, path){
    if(current.x == 14 || current.x == 0 || current.y == 10 || current.y == 0 || current.y == 20)
        return true;
    
    for(var i=0; i< path.length;i++){
        if(current.x == path[i].start.x && current.y == path[i].start.y)
            return true;
    }



    return false;
}

//----Tutaj dzieje się magia - > server zarządza odebranym obiektem i zarządza grą --------------
function gameEngine(data, red, blue, req){

     //----dodaj ścieżke
    data.path.push(req.path);
    //----zmień punkt teraźniejszy
    data.current = req.path.end;
    //----ustaw możliwe ruchy
    data.moves = generateMoves(data.current,data.path);

    //KTOS WYGRAŁ?
    if(data.current.x >= 6 && data.current.x <= 8){
        if(data.current.y == 0)
            data.win = "b";
        else if(data.current.y == 20)
            data.win = "r";
    }

    //nie zmieniaj druzyny jesli mozna ruszyc jeszcze raz
    if(!checkIfCanMoveMore(data.current,data.path)){
        //----odpowiednia drużyna ma teraz kolej
        if(data.now == "b")
            data.now = "r";
        else
            data.now = "b";
    }

    //----odpowiednia osoba ma teraz kolej
    if(data.now == "b" && blue.length > 0)
        data.user = blue[0].id;
    else if(data.now == "r" && red.length > 0)
        data.user = red[0].id;

    return data;
}



function setSocket(io){
    var redTeam = [];
    var blueTeam = [];
    var dane = {
            user: "1",
            now: "b",
            moves: generateMoves({x: 7, y:10}),
            current: {x: 7, y:10},
            path:[]
        }

    io.sockets.on("connection", function (socket) {
        socket.on("message", function (data) {
               //---Jesli start---------------------------
                if(data.start){
                   //START CLICKED
                    var usr = {name: data.name, id: generateID(redTeam,blueTeam), token: generateToken()};
                    var add = true;
                    if(blueTeam.length > 0){
                        if(redTeam.length == 0){
                            redTeam.push(usr);
                            io.sockets.emit("teams",getNames(redTeam,blueTeam));
                        }
                        else{
                            socket.disconnect();
                            add = false;
                        }
                    }
                    else{
                        blueTeam.push(usr);
                        io.sockets.emit("teams",getNames(redTeam,blueTeam));
                    }

                    //wyslij token i zapisz do disconnecta
                    socket.emit("token",usr);
                    socket.set("token", usr.token);

                    //debug 
                    console.log(blueTeam); console.log(redTeam);
                //-----Jesli dane growe to rób
                }else if(data.path != undefined && !data.win){
                        dane = gameEngine(dane, redTeam, blueTeam, data);
                }

           
            //Wyslij wiadomość z gra jesli 2 druzyny gotowe
            if(blueTeam.length > 0 && redTeam.length > 0){
                io.sockets.emit("echo",dane);
            }

           
           
        });
        socket.on("error", function (err) {
            console.dir(err);
        });

        socket.on('disconnect', function (){
                socket.get("token",function(err,token){
                    //usun wylogowana osobe z druzyny
                    if(!removeDisconnected(redTeam,token))
                        removeDisconnected(blueTeam,token);

                    io.sockets.emit("teams",getNames(redTeam,blueTeam));
                });
                    
            });
    });

}
module.exports.setSocket = setSocket;