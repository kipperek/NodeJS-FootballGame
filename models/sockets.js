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

function arrDel(arr,toDel){
    for(var i=0;i < toDel.length;i++)
        arr.splice(toDel[i],1);
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

function generateMoves(current, data){
    var moves = createMoves(current);
    
    //jesteśmy przy ściankach
    if(current.x == 0 || current.x == 14){
        var toDel = [];
        for(var i=0; i< moves.length;i++){
            if(moves[i].x == current.x)
                toDel.push(i);
        }
        arrDel(moves,toDel);
    }
    //jesteśmy na środku
    if(current.y == 10){
        var toDel = [];
        for(var i=0; i< moves.length;i++){
            if(moves[i].y == current.y)
                toDel.push(i);
        }
        arrDel(moves,toDel);
    }
    
    return moves;
}

//----Tutaj dzieje się magia - > server zarządza odebranym obiektem i zarządza grą --------------
function gameEngine(data, red, blue, req){

    if(data.now == "b")
        data.now = "r";
    else
        data.now = "b";

    if(data.now == "b" && blue.length > 0)
        data.user = blue[0].id;
    else if(data.now == "r" && red.length > 0)
        data.user = red[0].id;

    //dodaj ścieżke
    data.path.push(req.path);
    data.current = req.path.end;
    data.moves = generateMoves(data.current);

    return data;
}



function setSocket(io){

    var redTeam = [];
    var blueTeam = [];
    var nowUser = {};
    //socket 
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
                        if(redTeam.length == 0)
                            redTeam.push(usr);
                        else{
                            socket.disconnect();
                            add = false;
                        }
                    }
                    else
                        blueTeam.push(usr);

                    //wyslij token i zapisz do disconnecta
                    socket.emit("token",usr);
                    socket.set("token", usr.token);

                    //debug 
                    console.log(blueTeam); console.log(redTeam);
                //-----Jesli dane growe to rób
                }else if(data.path != undefined){
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
                });
                    
            });
    });

}
module.exports.setSocket = setSocket;