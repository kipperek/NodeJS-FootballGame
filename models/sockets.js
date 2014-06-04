function getNames(red,blue,data){
    var rTeam = [];
    var bTeam = [];

    for(var i=0; i < red.length; i++)
        rTeam.push({name: red[i].name, id: red[i].id});

    for(var i=0; i < blue.length; i++)
        bTeam.push({name: blue[i].name, id: blue[i].id});

    return {red: rTeam, blue: bTeam, id: data.user};
}

function removeDisconnected(arr,token,data){
    var deleted = false;
    var thisUsr = false;
    var index = 0;
    for(var i =0; i < arr.length; i++){
        if(arr[i].token == token){
            if(data.user == arr[i].id)
               thisUsr = true;

            index = i;
            deleted = true;
            break;
        }
    }
    if(deleted)
        arr.splice(index, 1);

    if(thisUsr){
        if(index < arr.length)
            data.user =arr[index].id;
        else if(arr.length>0)
            data.user = arr[index-1].id;
    }

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

//----TODO REFAKTOR------------------------
//-----------------------------------------
function generateMoves(current, data){
    var moves = createMoves(current);
    
    //jesteśmy przy ściankach
    if(current.x == 0 || current.x == 14){
        for(var i=0; i< moves.length;i++){
            if(moves[i].x == current.x)
                moves[i].forbidden = true;
        }
    }
    //jesteśmy na środku
    if(current.y == 10){
        for(var i=0; i< moves.length;i++){
            if(moves[i].y == current.y)
                moves[i].forbidden = true;
        }
    }
    //jesteśmy u góry lub na dole i jeszcze ochrniaamy ze mozemy do bramki wrzucic
    if(current.y == 0 || current.y == 20){
        for(var i=0; i< moves.length;i++){
            if(moves[i].y == current.y && (moves[i].x < 6 || moves[i].x > 8))
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

    for(var i=0; i< moves.length;i++){
        if(moves[i].x < 0 || moves[i].x > 14 || moves[i].y < 0 || moves[i].y > 20)
            moves[i].forbidden = true;
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

function checkIfDraw(moves){
    for(var i=0; i<moves.length; i++){
        if(!moves[i].forbidden)
            return false;
    }

    return true;
}

function findToken(id, red, blue){
    for(var i=0; i< red.length;i++)
        if(red[i].id == id)
            return red[i].token;

     for(var i=0; i< blue.length;i++)
        if(blue[i].id == id)
            return blue[i].token;

    return false;
}

function hakierCheck(current, moves, expectedToken, req){
    //czy odpowiednia osoba wyslala request
    if(req.token != expectedToken|| !req.path)
        return false;

    //czy ruch jest taki jak być powinien i nie jest zabroniony `
    if(req.path.start.x != current.x || req.path.start.y != current.y)
        return false;

    for(var i=0; i< moves.length;i++){
        if(moves[i].x == req.path.end.x && moves[i].y == req.path.end.y && !moves[i].forbidden)
            return true;
    }

    return false;
}

//----Tutaj dzieje się magia - > server zarządza odebranym obiektem i zarządza grą --------------
function gameEngine(data, red, blue, req){

    if(hakierCheck(data.current, data.moves, findToken(data.user,red,blue), req)){
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

        if(!data.win && checkIfDraw(data.moves))
            data.win = "rb";

        //nie zmieniaj druzyny jesli mozna ruszyc jeszcze raz
        if(!checkIfCanMoveMore(data.current,data.path)){
            //----odpowiednia drużyna ma teraz kolej
            if(data.now == "b")
                data.now = "r";
            else
                data.now = "b";
        }

        //----odpowiednia osoba ma teraz kolej
        if(data.now == "b" && blue.length > 0){

            if(data.lastB + 1 >= blue.length)
                data.lastB = 0;
            else
                data.lastB += 1;

            data.user = blue[data.lastB].id;
        }
        else if(data.now == "r" && red.length > 0){
            if(data.lastR + 1 >= red.length)
                data.lastR = 0;
            else
                data.lastR += 1;

            data.user = red[data.lastR].id;
        }
    }

    return data;
}

function generateMessage(data){
    var msg = {
        user: "",
        now: "",
        moves: [],
        current: {},
        path: [],
       
    };
    msg.user = data.user;
    msg.now = data.now;
    msg.moves = data.moves;
    msg.current = data.current;
    if(data.win){
        msg.win = data.win;
    }

    if(data.path.length > 0)
        msg.path.push(data.path[data.path.length-1]);

    return msg;
}

function newGame(){
    return {
            user: "1",
            now: "b",
            moves: generateMoves({x: 7, y:10}),
            current: {x: 7, y:10},
            path:[],
            lastB: 0,
            lastR: 0
        };
}

function findData(data, id){
    for(var i=0; i< data.length;i++){
        if(data[i].id == id)
            return data[i];
    }

    return null;
}
function setNew(data,id){
     for(var i=0; i< data.length;i++){
        if(data[i].id == id)
            data[i].data = newGame();
    }
}

function setSocket(io){
   // var redTeam = [];
   // var blueTeam = [];
    var rooms = [{id: 0, name: "Global", redTeam: [], blueTeam: [], blocked: false }];
    var roomsPass = [];
    var dane = [{id: 0, data: newGame() }];

    io.sockets.on("connection", function (socket) {
        socket.emit('newLobbies',{"rooms": rooms });

        socket.on("createRoom", function (data) {
            var newId = rooms[rooms.length -1].id + 1;
            rooms.push({id: newId, name: data.name, redTeam: [], blueTeam: [], blocked: data.blocked });
            if(data.blocked)
                roomsPass.push({id: newId, pass: data.pass });

            dane.push({id: newId, data: newGame() });
           
            io.sockets.emit('newLobbies',{"rooms": rooms });
            

        });

        socket.on("joingame",function (data){
            
            var pass = findData(roomsPass, data.id);
            //jezeli hasło sie zgadza to dodaj mnie do rumu
            if(pass === null || pass.pass == data.pass){

                if(pass)
                    socket.emit('join',{ok: true});

                var room = findData(rooms,data.id);
                var gameData = findData(dane, data.id).data;
                var usr = {name: data.name, id: generateID(room.redTeam,room.blueTeam), token: generateToken()};
                socket.join(room.id);
                
                if(room.blueTeam.length > room.redTeam.length){
                    room.redTeam.push(usr);
                     if(gameData.now == "r")
                        gameData.user = room.redTeam[0].id;
                }
                else{
                    room.blueTeam.push(usr);
                    if(gameData.now == "b")
                        gameData.user = room.blueTeam[0].id;
                }
                io.sockets.in(room.id).emit("teams",getNames(room.redTeam,room.blueTeam,gameData));
                io.sockets.emit('newLobbies',{"rooms": rooms });

                
                //wyslij token i zapisz do disconnecta
                socket.emit("token",usr);
                socket.set("token", usr.token);
                socket.set("name", usr.name);
                socket.set("roomId", data.id);

                var newData = gameData;
                newData.connect = true;
                socket.emit('echo',newData);
                io.sockets.in(room.id).emit("echo",generateMessage(gameData));
            }else{
                socket.emit('join',{ok: false});
            }

        });

        socket.on("message", function (data) {
            socket.get("roomId",function(err,roomId){
                var gameData = findData(dane, roomId).data;
                var room = findData(rooms, roomId);
            

               if(gameData.path != undefined && !gameData.win){
                        gameData = gameEngine(gameData, room.redTeam, room.blueTeam, data);
                }

                //Wyslij wiadomość z gra jesli 2 druzyny gotowe
                if(room.blueTeam.length > 0 && room.redTeam.length > 0){
                    io.sockets.in(room.id).emit("echo",generateMessage(gameData));
                }
            });
        });

        socket.on("restart", function (data) {
            socket.get("roomId",function(err,roomId){
                var room = findData(rooms, roomId);
                var gameData = findData(dane, roomId).data;
               
                if(gameData.win){
                    gameData = newGame();
                    setNew(dane,room.id);
                    
                    if(room.blueTeam.length > 0 && room.redTeam.length > 0){
                       io.sockets.in(room.id).emit("echo",generateMessage(gameData));
                    }
                }
            });
        });
        socket.on("error", function (err) {
            console.dir(err);
        });

        function leaveRoom(){
           socket.get("token",function(err,token){
                socket.get("roomId",function(err,roomId){
                  if(roomId && token){
                        var room = findData(rooms, roomId);
                        var gameData = findData(dane, roomId).data;

                        if(!removeDisconnected(room.redTeam,token, gameData))
                            removeDisconnected(room.blueTeam,token, gameData);

                        io.sockets.in(room.id).emit("teams",getNames(room.redTeam,room.blueTeam, gameData));
                        io.sockets.in(room.id).emit("echo",generateMessage(gameData));
                        io.sockets.emit('newLobbies',{"rooms": rooms });
                    }
                });
            });
        }

        socket.on('disconnect', function (){
             leaveRoom();       
        });
    });

}
module.exports.setSocket = setSocket;